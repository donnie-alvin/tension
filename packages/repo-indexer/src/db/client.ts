import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from './schema'

export function createRepoIndexerPool(
  databaseUrl = process.env.DATABASE_URL,
): Pool {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set for repo-indexer database access')
  }

  return new Pool({ connectionString: databaseUrl })
}

export function createRepoIndexerDb(
  repoIndexerPool: Pool,
): NodePgDatabase<typeof schema> {
  return drizzle(repoIndexerPool, { schema })
}

export interface RepoIndexerDatabaseRuntime {
  pool: Pool
  db: RepoIndexerDbClient
  close(): Promise<void>
}

export function createRepoIndexerDatabase(
  databaseUrl = process.env.DATABASE_URL,
): RepoIndexerDatabaseRuntime {
  const pool = createRepoIndexerPool(databaseUrl)
  const db = createRepoIndexerDb(pool)

  return {
    pool,
    db,
    async close() {
      await pool.end()
    },
  }
}

export type RepoIndexerDbClient = NodePgDatabase<typeof schema>
