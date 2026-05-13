import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

export type RepoIndexerDbClient = ReturnType<typeof createRepoIndexerDb>;

export function createRepoIndexerPool(databaseUrl = process.env.DATABASE_URL): Pool {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set for repo-indexer database access");
  }

  return new Pool({ connectionString: databaseUrl });
}

export function createRepoIndexerDb(databaseUrl = process.env.DATABASE_URL) {
  return drizzle(createRepoIndexerPool(databaseUrl), { schema });
}
