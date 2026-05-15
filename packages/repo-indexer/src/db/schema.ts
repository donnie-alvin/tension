import {
  boolean,
  customType,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

function parseVectorLiteral(value: string): number[] {
  const trimmed = value.trim()
  if (trimmed === '[]' || trimmed === '{}') {
    return []
  }

  const normalized = trimmed
    .replace(/^\[/, '')
    .replace(/^\{/, '')
    .replace(/\]$/, '')
    .replace(/\}$/, '')
  if (!normalized) {
    return []
  }

  return normalized.split(',').map((part) => Number(part.trim()))
}

export const vector1536 = customType<{
  data: number[]
  driverData: string
}>({
  dataType() {
    return 'vector(1536)'
  },
  toDriver(value) {
    return `[${value.join(',')}]`
  },
  fromDriver(value) {
    return parseVectorLiteral(value)
  },
})

export const repoIndexFiles = pgTable(
  'repo_index_files',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').notNull(),
    repoPath: text('repo_path').notNull(),
    filePath: text('file_path').notNull(),
    language: text('language').notNull(),
    contentHash: text('content_hash').notNull(),
    lineCount: integer('line_count'),
    indexedAt: timestamp('indexed_at', { withTimezone: true }),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    repoIndexFilesProjectContentHashIdx: index(
      'repo_index_files_project_id_content_hash_idx',
    ).on(table.projectId, table.contentHash),
  }),
)

export const repoIndexChunks = pgTable(
  'repo_index_chunks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fileId: uuid('file_id')
      .notNull()
      .references(() => repoIndexFiles.id, { onDelete: 'cascade' }),
    chunkIndex: integer('chunk_index'),
    chunkType: text('chunk_type'),
    symbolName: text('symbol_name'),
    content: text('content').notNull(),
    startLine: integer('start_line'),
    endLine: integer('end_line'),
    tokenCount: integer('token_count'),
    embedding: vector1536('embedding'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    repoIndexChunksEmbeddingHnswIdx: index(
      'repo_index_chunks_embedding_hnsw_idx',
    )
      .using('hnsw', table.embedding.op('vector_cosine_ops'))
      .with({ m: 16, ef_construction: 64 }),
    repoIndexChunksFileChunkIndexIdx: index(
      'repo_index_chunks_file_id_chunk_index_idx',
    ).on(table.fileId, table.chunkIndex),
    repoIndexChunksContentTrgmIdx: index(
      'repo_index_chunks_content_trgm_idx',
    ).using('gin', table.content.op('gin_trgm_ops')),
    repoIndexChunksSymbolNameTrgmIdx: index(
      'repo_index_chunks_symbol_name_trgm_idx',
    ).using('gin', table.symbolName.op('gin_trgm_ops')),
  }),
)

export const repoIndexSymbols = pgTable('repo_index_symbols', {
  id: uuid('id').defaultRandom().primaryKey(),
  fileId: uuid('file_id')
    .notNull()
    .references(() => repoIndexFiles.id, { onDelete: 'cascade' }),
  name: text('name'),
  kind: text('kind'),
  isExported: boolean('is_exported'),
  isDefaultExport: boolean('is_default_export'),
  chunkId: uuid('chunk_id').references(() => repoIndexChunks.id, {
    onDelete: 'set null',
  }),
})

export const repoIndexImports = pgTable('repo_index_imports', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceFileId: uuid('source_file_id')
    .notNull()
    .references(() => repoIndexFiles.id, { onDelete: 'cascade' }),
  importSpecifier: text('import_specifier'),
  resolvedFileId: uuid('resolved_file_id').references(() => repoIndexFiles.id, {
    onDelete: 'set null',
  }),
  isExternal: boolean('is_external'),
  importedNames: text('imported_names').array(),
})

export const repoIndexSummaries = pgTable(
  'repo_index_summaries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fileId: uuid('file_id')
      .notNull()
      .references(() => repoIndexFiles.id, { onDelete: 'cascade' }),
    chunkId: uuid('chunk_id').references(() => repoIndexChunks.id, {
      onDelete: 'set null',
    }),
    summary: text('summary'),
    summaryEmbedding: vector1536('summary_embedding'),
    model: text('model'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    repoIndexSummariesSummaryEmbeddingHnswIdx: index(
      'repo_index_summaries_summary_embedding_hnsw_idx',
    )
      .using('hnsw', table.summaryEmbedding.op('vector_cosine_ops'))
      .with({ m: 16, ef_construction: 64 }),
  }),
)
