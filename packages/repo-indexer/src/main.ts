import { pathToFileURL } from 'node:url'

import { createRepoIndexerDatabase } from './db'
import {
  createDrizzleRepoIndexStore,
  InMemoryRepoIndexStore,
  indexRepository,
} from './indexer'
import type { IndexingRequest, RepoIndexStore } from './types'

export interface RepoIndexerCliOptions {
  argv?: string[]
  env?: NodeJS.ProcessEnv
  store?: RepoIndexStore
}

export async function runRepoIndexerCli(
  options: RepoIndexerCliOptions = {},
): Promise<void> {
  const argv = options.argv ?? process.argv.slice(2)
  const env = options.env ?? process.env
  const request = createRequestFromArgs(argv, env)
  const databaseRuntime = options.store
    ? undefined
    : env.DATABASE_URL
      ? createRepoIndexerDatabase(env.DATABASE_URL)
      : undefined
  const store =
    options.store ??
    (databaseRuntime
      ? createDrizzleRepoIndexStore(databaseRuntime.db)
      : new InMemoryRepoIndexStore())

  try {
    const result = await indexRepository(request, store)
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  } finally {
    await databaseRuntime?.close()
  }
}

function createRequestFromArgs(
  argv: string[],
  env: NodeJS.ProcessEnv,
): IndexingRequest {
  const args = new Map<string, string>()

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]

    if (!value.startsWith('--')) {
      continue
    }

    args.set(value.slice(2), argv[index + 1] ?? '')
    index += 1
  }

  const projectId =
    args.get('projectId') ?? env.REPO_INDEXER_PROJECT_ID ?? env.PROJECT_ID
  const repoPath =
    args.get('repoPath') ?? env.REPO_INDEXER_REPO_PATH ?? env.REPO_PATH

  if (!projectId || !repoPath) {
    throw new Error(
      'repo-indexer requires --projectId/REPO_INDEXER_PROJECT_ID and --repoPath/REPO_INDEXER_REPO_PATH',
    )
  }

  return {
    projectId,
    repoPath,
    workflowId: args.get('workflowId') ?? env.WORKFLOW_ID,
    requestId: args.get('requestId') ?? env.REQUEST_ID,
    maxFiles: parseOptionalInteger(
      args.get('maxFiles') ?? env.REPO_INDEXER_MAX_FILES,
    ),
    maxChunks: parseOptionalInteger(
      args.get('maxChunks') ?? env.REPO_INDEXER_MAX_CHUNKS,
    ),
    maxTokens: parseOptionalInteger(
      args.get('maxTokens') ?? env.REPO_INDEXER_MAX_TOKENS,
    ),
    force: parseBoolean(args.get('force') ?? env.REPO_INDEXER_FORCE),
  }
}

function parseOptionalInteger(value: string | undefined): number | undefined {
  return value ? Number.parseInt(value, 10) : undefined
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined
  }

  return ['1', 'true', 'yes'].includes(value.toLowerCase())
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runRepoIndexerCli().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.stack : String(error)}\n`,
    )
    process.exitCode = 1
  })
}
