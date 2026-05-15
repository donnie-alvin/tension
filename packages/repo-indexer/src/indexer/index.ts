import { randomUUID } from 'node:crypto'

import { and, desc, eq } from 'drizzle-orm'

import { chunkParsedFile } from '../chunker'
import { createDeterministicEmbedding, embedChunks } from '../embedder'
import { extractFileMetadata } from '../extractor'
import { parseRepository } from '../parser'
import { selectChunksWithinBudget } from '../retrieval'
import { summarizeFile } from '../summarizer'
import {
  repoIndexChunks,
  repoIndexFiles,
  repoIndexImports,
  repoIndexSummaries,
  repoIndexSymbols,
} from '../db/schema'
import type { RepoIndexerDbClient } from '../db'
import type {
  EmbeddedRepoChunk,
  FileIndexStatus,
  IndexedFileResult,
  IndexingRequest,
  IndexingResult,
  PersistIndexedFileInput,
  PersistIndexedFileResult,
  RepoIndexStore,
  StoredIndexedFile,
  StoredRepoChunk,
} from '../types'

const defaultIndexingBudget = {
  maxChunks: 1_000,
  maxTokens: 200_000,
}

export async function indexRepository(
  request: IndexingRequest,
  store: RepoIndexStore,
): Promise<IndexingResult> {
  const parsedFiles = await parseRepository(request)
  const files: IndexedFileResult[] = []
  let filesIndexed = 0
  let filesSkipped = 0
  let chunksIndexed = 0
  let tokenCount = 0
  let budgetExhausted = false
  const maxChunks = request.maxChunks ?? defaultIndexingBudget.maxChunks
  const maxTokens = request.maxTokens ?? defaultIndexingBudget.maxTokens

  for (const file of parsedFiles) {
    const existing = await store.getFileByPath({
      projectId: request.projectId,
      repoPath: file.repoPath,
      filePath: file.filePath,
    })

    if (
      !request.force &&
      existing?.contentHash === file.contentHash &&
      existing.status === 'indexed'
    ) {
      filesSkipped += 1
      files.push({
        filePath: file.filePath,
        status: 'skipped',
        contentHash: file.contentHash,
        chunksIndexed: 0,
        reason: 'unchanged',
      })
      continue
    }

    if (chunksIndexed >= maxChunks || tokenCount >= maxTokens) {
      budgetExhausted = true
      filesSkipped += 1
      files.push({
        filePath: file.filePath,
        status: 'skipped',
        contentHash: file.contentHash,
        chunksIndexed: 0,
        reason: 'indexing-budget-exhausted',
      })
      continue
    }

    const selectedChunks = selectChunksWithinBudget(
      chunkParsedFile(file).map((chunk) => ({
        chunk: {
          id: `${file.filePath}:${chunk.chunkIndex}`,
          fileId: file.filePath,
          filePath: file.filePath,
          chunkIndex: chunk.chunkIndex,
          chunkType: chunk.chunkType,
          symbolName: chunk.symbolName ?? null,
          content: chunk.content,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          tokenCount: chunk.tokenCount,
        },
        score: 1,
      })),
      {
        maxChunks: maxChunks - chunksIndexed,
        maxTokens: maxTokens - tokenCount,
      },
    ).chunks

    if (selectedChunks.length === 0) {
      budgetExhausted = true
      filesSkipped += 1
      files.push({
        filePath: file.filePath,
        status: 'skipped',
        contentHash: file.contentHash,
        chunksIndexed: 0,
        reason: 'file-exceeds-token-budget',
      })
      continue
    }

    const metadata = extractFileMetadata(file)
    const chunks = embedChunks(
      selectedChunks.map((chunk) => ({
        chunkIndex: chunk.chunkIndex,
        chunkType: 'file',
        symbolName: chunk.symbolName ?? undefined,
        content: chunk.content,
        startLine: chunk.startLine ?? 1,
        endLine: chunk.endLine ?? 1,
        tokenCount: chunk.tokenCount,
      })),
    )
    const persisted = await store.persistIndexedFile({
      file,
      chunks,
      symbols: metadata.symbols,
      imports: metadata.imports,
      summary: summarizeFile(file),
    })

    filesIndexed += 1
    chunksIndexed += persisted.chunksIndexed
    tokenCount += chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0)
    files.push({
      filePath: file.filePath,
      status: 'indexed',
      contentHash: file.contentHash,
      chunksIndexed: persisted.chunksIndexed,
    })
  }

  return {
    projectId: request.projectId,
    repoPath: parsedFiles[0]?.repoPath ?? request.repoPath,
    filesSeen: parsedFiles.length,
    filesIndexed,
    filesSkipped,
    chunksIndexed,
    tokenCount,
    budgetExhausted,
    files,
  }
}

export class InMemoryRepoIndexStore implements RepoIndexStore {
  private readonly files = new Map<string, StoredIndexedFile>()
  private readonly chunks = new Map<string, StoredRepoChunk[]>()

  async getFileByPath(input: {
    projectId: string
    repoPath: string
    filePath: string
  }): Promise<StoredIndexedFile | undefined> {
    return this.files.get(fileKey(input))
  }

  async persistIndexedFile(
    input: PersistIndexedFileInput,
  ): Promise<PersistIndexedFileResult> {
    const key = fileKey(input.file)
    const existing = this.files.get(key)
    const fileId = existing?.id ?? randomUUID()
    const indexedAt = new Date()

    this.files.set(key, {
      id: fileId,
      projectId: input.file.projectId,
      repoPath: input.file.repoPath,
      filePath: input.file.filePath,
      language: input.file.language,
      contentHash: input.file.contentHash,
      lineCount: input.file.lineCount,
      indexedAt,
      status: 'indexed',
    })

    this.chunks.set(
      fileId,
      input.chunks.map((chunk) => ({
        id: randomUUID(),
        fileId,
        filePath: input.file.filePath,
        chunkIndex: chunk.chunkIndex,
        chunkType: chunk.chunkType,
        symbolName: chunk.symbolName ?? null,
        content: chunk.content,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        tokenCount: chunk.tokenCount,
        embedding: chunk.embedding,
      })),
    )

    return {
      fileId,
      chunksIndexed: input.chunks.length,
    }
  }

  async listChunks(projectId: string): Promise<StoredRepoChunk[]> {
    const fileIds = [...this.files.values()]
      .filter((file) => file.projectId === projectId)
      .map((file) => file.id)
    const chunks = fileIds.flatMap((fileId) => this.chunks.get(fileId) ?? [])

    return chunks.sort((left, right) => {
      if (left.filePath !== right.filePath) {
        return left.filePath.localeCompare(right.filePath)
      }

      return left.chunkIndex - right.chunkIndex
    })
  }
}

export function createDrizzleRepoIndexStore(
  db: RepoIndexerDbClient,
): RepoIndexStore {
  return {
    async getFileByPath(input) {
      const rows = await db
        .select()
        .from(repoIndexFiles)
        .where(
          and(
            eq(repoIndexFiles.projectId, input.projectId),
            eq(repoIndexFiles.repoPath, input.repoPath),
            eq(repoIndexFiles.filePath, input.filePath),
          ),
        )
        .orderBy(desc(repoIndexFiles.updatedAt))
        .limit(1)

      return rows[0] ? toStoredIndexedFile(rows[0]) : undefined
    },

    async persistIndexedFile(input) {
      const now = new Date()
      const existing = await this.getFileByPath({
        projectId: input.file.projectId,
        repoPath: input.file.repoPath,
        filePath: input.file.filePath,
      })
      const fileId =
        existing?.id ??
        (
          await db
            .insert(repoIndexFiles)
            .values({
              projectId: input.file.projectId,
              repoPath: input.file.repoPath,
              filePath: input.file.filePath,
              language: input.file.language,
              contentHash: input.file.contentHash,
              lineCount: input.file.lineCount,
              indexedAt: now,
              status: 'indexed',
              updatedAt: now,
            })
            .returning({ id: repoIndexFiles.id })
        )[0].id

      if (existing) {
        await db
          .update(repoIndexFiles)
          .set({
            language: input.file.language,
            contentHash: input.file.contentHash,
            lineCount: input.file.lineCount,
            indexedAt: now,
            status: 'indexed',
            updatedAt: now,
          })
          .where(eq(repoIndexFiles.id, fileId))
      }

      await replaceFileMetadata(db, fileId, input)

      return {
        fileId,
        chunksIndexed: input.chunks.length,
      }
    },

    async listChunks(projectId) {
      const rows = await db
        .select({
          id: repoIndexChunks.id,
          fileId: repoIndexChunks.fileId,
          filePath: repoIndexFiles.filePath,
          chunkIndex: repoIndexChunks.chunkIndex,
          chunkType: repoIndexChunks.chunkType,
          symbolName: repoIndexChunks.symbolName,
          content: repoIndexChunks.content,
          startLine: repoIndexChunks.startLine,
          endLine: repoIndexChunks.endLine,
          tokenCount: repoIndexChunks.tokenCount,
          embedding: repoIndexChunks.embedding,
        })
        .from(repoIndexChunks)
        .innerJoin(
          repoIndexFiles,
          eq(repoIndexChunks.fileId, repoIndexFiles.id),
        )
        .where(eq(repoIndexFiles.projectId, projectId))

      return rows
        .map((row) => ({
          ...row,
          chunkIndex: row.chunkIndex ?? 0,
          tokenCount: row.tokenCount ?? 0,
        }))
        .sort((left, right) => {
          if (left.filePath !== right.filePath) {
            return left.filePath.localeCompare(right.filePath)
          }

          return left.chunkIndex - right.chunkIndex
        })
    },
  }
}

async function replaceFileMetadata(
  db: RepoIndexerDbClient,
  fileId: string,
  input: PersistIndexedFileInput,
): Promise<void> {
  await db
    .delete(repoIndexImports)
    .where(eq(repoIndexImports.sourceFileId, fileId))
  await db.delete(repoIndexSymbols).where(eq(repoIndexSymbols.fileId, fileId))
  await db
    .delete(repoIndexSummaries)
    .where(eq(repoIndexSummaries.fileId, fileId))
  await db.delete(repoIndexChunks).where(eq(repoIndexChunks.fileId, fileId))

  const insertedChunks =
    input.chunks.length === 0
      ? []
      : await db
          .insert(repoIndexChunks)
          .values(
            input.chunks.map((chunk) => ({
              fileId,
              chunkIndex: chunk.chunkIndex,
              chunkType: chunk.chunkType,
              symbolName: chunk.symbolName,
              content: chunk.content,
              startLine: chunk.startLine,
              endLine: chunk.endLine,
              tokenCount: chunk.tokenCount,
              embedding: chunk.embedding,
            })),
          )
          .returning({
            id: repoIndexChunks.id,
            chunkIndex: repoIndexChunks.chunkIndex,
          })

  if (input.symbols.length > 0) {
    await db.insert(repoIndexSymbols).values(
      input.symbols.map((symbol) => ({
        fileId,
        name: symbol.name,
        kind: symbol.kind,
        isExported: symbol.isExported,
        isDefaultExport: symbol.isDefaultExport,
        chunkId: findChunkIdForLine(insertedChunks, input.chunks, symbol.line),
      })),
    )
  }

  if (input.imports.length > 0) {
    await db.insert(repoIndexImports).values(
      input.imports.map((item) => ({
        sourceFileId: fileId,
        importSpecifier: item.importSpecifier,
        isExternal: item.isExternal,
        importedNames: item.importedNames,
      })),
    )
  }

  await db.insert(repoIndexSummaries).values({
    fileId,
    summary: input.summary.summary,
    summaryEmbedding: createDeterministicEmbedding(input.summary.summary),
    model: input.summary.model,
  })
}

function findChunkIdForLine(
  insertedChunks: { id: string; chunkIndex: number | null }[],
  chunks: EmbeddedRepoChunk[],
  line: number,
): string | null {
  const chunk = chunks.find(
    (item) => item.startLine <= line && item.endLine >= line,
  )
  const insertedChunk = insertedChunks.find(
    (item) => item.chunkIndex === chunk?.chunkIndex,
  )

  return insertedChunk?.id ?? null
}

function toStoredIndexedFile(
  row: typeof repoIndexFiles.$inferSelect,
): StoredIndexedFile {
  return {
    id: row.id,
    projectId: row.projectId,
    repoPath: row.repoPath,
    filePath: row.filePath,
    language: row.language,
    contentHash: row.contentHash,
    lineCount: row.lineCount,
    indexedAt: row.indexedAt,
    status: row.status as FileIndexStatus,
  }
}

function fileKey(input: {
  projectId: string
  repoPath: string
  filePath: string
}): string {
  return `${input.projectId}:${input.repoPath}:${input.filePath}`
}
