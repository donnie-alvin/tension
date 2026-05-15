import { createHash } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

import type { IndexingRequest, ParsedFile } from '../types'

const skippedDirectories = new Set([
  '.git',
  '.next',
  '.turbo',
  'build',
  'coverage',
  'dist',
  'logs',
  'node_modules',
])

const defaultExtensions = new Set([
  '.c',
  '.cpp',
  '.cs',
  '.css',
  '.go',
  '.h',
  '.hpp',
  '.html',
  '.java',
  '.js',
  '.jsx',
  '.json',
  '.kt',
  '.md',
  '.mjs',
  '.py',
  '.rs',
  '.sh',
  '.sql',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml',
])

const maxReadableFileBytes = 1_000_000

export async function parseRepository(
  request: IndexingRequest,
): Promise<ParsedFile[]> {
  const repoPath = path.resolve(request.repoPath)
  const files = await discoverRepositoryFiles(repoPath, {
    includeGlobs: request.includeGlobs,
    maxFiles: request.maxFiles ?? 200,
  })

  const parsedFiles: ParsedFile[] = []

  for (const absolutePath of files) {
    const fileStat = await stat(absolutePath)

    if (fileStat.size > maxReadableFileBytes) {
      continue
    }

    const content = await readFile(absolutePath, 'utf8')

    if (content.includes('\0')) {
      continue
    }

    const filePath = toRepoRelativePath(repoPath, absolutePath)

    parsedFiles.push({
      projectId: request.projectId,
      repoPath,
      absolutePath,
      filePath,
      language: detectLanguage(filePath),
      content,
      contentHash: hashContent(content),
      lineCount: content.length === 0 ? 0 : content.split(/\r?\n/).length,
    })
  }

  return parsedFiles
}

export async function discoverRepositoryFiles(
  repoPath: string,
  options: { includeGlobs?: string[]; maxFiles: number },
): Promise<string[]> {
  const discovered: string[] = []

  async function visit(directoryPath: string): Promise<void> {
    if (discovered.length >= options.maxFiles) {
      return
    }

    const entries = await readdir(directoryPath, { withFileTypes: true })

    for (const entry of entries.sort((left, right) =>
      left.name.localeCompare(right.name),
    )) {
      if (discovered.length >= options.maxFiles) {
        return
      }

      const absolutePath = path.join(directoryPath, entry.name)

      if (entry.isDirectory()) {
        if (!skippedDirectories.has(entry.name)) {
          await visit(absolutePath)
        }

        continue
      }

      if (!entry.isFile()) {
        continue
      }

      const relativePath = toRepoRelativePath(repoPath, absolutePath)

      if (shouldIncludeFile(relativePath, options.includeGlobs)) {
        discovered.push(absolutePath)
      }
    }
  }

  await visit(repoPath)

  return discovered
}

export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

export function detectLanguage(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase()

  switch (extension) {
    case '.ts':
    case '.tsx':
      return 'typescript'
    case '.js':
    case '.jsx':
    case '.mjs':
      return 'javascript'
    case '.md':
      return 'markdown'
    case '.json':
      return 'json'
    case '.yml':
    case '.yaml':
      return 'yaml'
    default:
      return extension.replace('.', '') || 'text'
  }
}

function shouldIncludeFile(filePath: string, includeGlobs?: string[]): boolean {
  if (includeGlobs && includeGlobs.length > 0) {
    return includeGlobs.some((glob) => matchesSimpleGlob(filePath, glob))
  }

  return defaultExtensions.has(path.extname(filePath).toLowerCase())
}

function matchesSimpleGlob(filePath: string, glob: string): boolean {
  const normalizedGlob = glob.replaceAll('\\', '/')

  if (normalizedGlob === '**/*') {
    return true
  }

  if (normalizedGlob.startsWith('**/*.')) {
    return filePath.endsWith(normalizedGlob.slice(4))
  }

  if (normalizedGlob.startsWith('*.')) {
    return path.basename(filePath).endsWith(normalizedGlob.slice(1))
  }

  return (
    filePath === normalizedGlob || filePath.startsWith(`${normalizedGlob}/`)
  )
}

function toRepoRelativePath(repoPath: string, absolutePath: string): string {
  return path.relative(repoPath, absolutePath).replaceAll(path.sep, '/')
}
