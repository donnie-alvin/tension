import { setTimeout as delay } from 'node:timers/promises'

import { isCancellationRequested } from '@traycer/queue'

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
