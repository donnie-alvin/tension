import { setTimeout as delay } from 'node:timers/promises'

import { isCancellationRequested } from '@traycer/queue'
import { Worker, type Job } from 'bullmq'
import IORedis from 'ioredis'

import type { FileIndexingQueue, IndexingJob } from '../api'
import { indexRepository } from '../indexer'
import type { IndexingResult, RepoIndexStore } from '../types'

export interface ProcessIndexingJobOptions {
  store: RepoIndexStore
  isCancelled?: (workflowId: string) => Promise<boolean>
}

export interface ProcessNextIndexingJobOptions extends ProcessIndexingJobOptions {
  queue: FileIndexingQueue
}

export interface RunIndexingWorkerOptions extends ProcessNextIndexingJobOptions {
  pollIntervalMs?: number
  once?: boolean
  signal?: AbortSignal
  onResult?: (result: IndexingResult) => void
}

export interface RunBullMQIndexingWorkerOptions extends ProcessIndexingJobOptions {
  queueName?: string
  redisUrl?: string
  concurrency?: number
}

export async function processIndexingJob(
  job: IndexingJob,
  options: ProcessIndexingJobOptions,
): Promise<IndexingResult> {
  const workflowId = job.request.workflowId ?? job.jobId
  const isCancelled =
    options.isCancelled ?? ((id: string) => isCancellationRequested(id))

  if (await isCancelled(workflowId)) {
    return {
      projectId: job.request.projectId,
      repoPath: job.request.repoPath,
      filesSeen: 0,
      filesIndexed: 0,
      filesSkipped: 0,
      chunksIndexed: 0,
      tokenCount: 0,
      budgetExhausted: false,
      files: [],
    }
  }

  return indexRepository(job.request, options.store)
}

export async function processNextIndexingJob(
  options: ProcessNextIndexingJobOptions,
): Promise<IndexingResult | undefined> {
  const job = await options.queue.claimNext()

  if (!job) {
    return undefined
  }

  try {
    const result = await processIndexingJob(job, options)
    await options.queue.complete(job, result)
    return result
  } catch (error) {
    await options.queue.fail(job, error)
    return undefined
  }
}

export async function runIndexingWorker(
  options: RunIndexingWorkerOptions,
): Promise<void> {
  const pollIntervalMs = options.pollIntervalMs ?? 1_000

  while (!options.signal?.aborted) {
    const result = await processNextIndexingJob(options)

    if (result) {
      options.onResult?.(result)
    }

    if (options.once) {
      return
    }

    await delay(pollIntervalMs, undefined, { signal: options.signal }).catch(
      (error) => {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        throw error
      },
    )
  }
}

export function createBullMQIndexingWorker(
  options: RunBullMQIndexingWorkerOptions,
): Worker {
  const connection = new IORedis(
    options.redisUrl ?? process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
    { maxRetriesPerRequest: null },
  )

  const worker = new Worker(
    options.queueName ?? 'repo-indexing',
    async (job: Job<IndexingJob['request']>) => {
      await job.updateProgress({ phase: 'indexing', filesIndexed: 0 })
      const result = await processIndexingJob(
        {
          jobId: job.id ?? String(job.name),
          request: job.data,
          status: 'processing',
          attempts: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts ?? 3,
          enqueuedAt: new Date(job.timestamp).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        options,
      )
      await job.updateProgress({
        phase: 'completed',
        filesIndexed: result.filesIndexed,
        filesSkipped: result.filesSkipped,
        chunksIndexed: result.chunksIndexed,
      })
      return result
    },
    {
      connection,
      concurrency: options.concurrency ?? 2,
      lockDuration: 120_000,
      stalledInterval: 30_000,
    },
  )

  worker.on('closed', () => connection.disconnect())
  worker.on('failed', (job, error) => {
    process.stderr.write(
      `repo-indexing job ${job?.id ?? 'unknown'} failed: ${
        error instanceof Error ? error.message : String(error)
      }\n`,
    )
  })

  return worker
}
