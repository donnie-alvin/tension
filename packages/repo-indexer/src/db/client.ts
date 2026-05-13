import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

export function createRepoIndexerPool(databaseUrl = process.env.DATABASE_URL): Pool {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set for repo-indexer database access");
  }

  return new Pool({ connectionString: databaseUrl });
}

export function createRepoIndexerDb(repoIndexerPool: Pool = pool) {
  return drizzle(repoIndexerPool, { schema });
}

export const pool = createRepoIndexerPool();
export const db = createRepoIndexerDb(pool);

export type RepoIndexerDbClient = typeof db;
