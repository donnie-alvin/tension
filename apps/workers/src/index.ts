import { pathToFileURL } from 'node:url'

import {
  createDrizzleRepoIndexStore,
  createRepoIndexerDatabase,
  FileIndexingQueue,
  InMemoryRepoIndexStore,
  runIndexingWorker,
} from '@traycer/repo-indexer'

export interface WorkerRuntimeOptions {
  once?: boolean
  pollIntervalMs?: number
  queue?: FileIndexingQueue
}

export interface WorkerRuntime {
  name: '@traycer/workers'
  role: 'background-workers'
  start(): Promise<void>
  stop(): void
}

export function createWorkerRuntime(
  options: WorkerRuntimeOptions = {},
): WorkerRuntime {
  const abortController = new AbortController()
  const queue = options.queue ?? new FileIndexingQueue()

  return {
    name: '@traycer/workers',
    role: 'background-workers',
    async start() {
      const databaseRuntime = process.env.DATABASE_URL
        ? createRepoIndexerDatabase(process.env.DATABASE_URL)
        : undefined
      const store = databaseRuntime
        ? createDrizzleRepoIndexStore(databaseRuntime.db)
        : new InMemoryRepoIndexStore()

      try {
        await runIndexingWorker({
          queue,
          store,
          once: options.once,
          pollIntervalMs: options.pollIntervalMs,
          signal: abortController.signal,
          onResult(result) {
            process.stdout.write(`${JSON.stringify(result)}\n`)
          },
        })
      } finally {
        await databaseRuntime?.close()
      }
    },
    stop() {
      abortController.abort()
    },
  }
}

export const workerRuntime = createWorkerRuntime()

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const once = process.env.WORKER_ONCE === '1'
  const runtime = createWorkerRuntime({ once })

  runtime.start().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.stack : String(error)}\n`,
    )
    process.exitCode = 1
  })

  if (!once) {
    for (const signal of ['SIGINT', 'SIGTERM'] as const) {
      process.once(signal, () => runtime.stop())
    }
  }
}
