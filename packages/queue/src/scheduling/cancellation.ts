import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { CancellationPayload } from '@traycer/shared'

export interface CancellationRecord extends CancellationPayload {
  requestedAt: string
}

export interface CancellationStore {
  requestCancellation(payload: CancellationPayload): Promise<CancellationRecord>
  isCancellationRequested(workflowId: string): Promise<boolean>
  getCancellation(workflowId: string): Promise<CancellationRecord | undefined>
  clearCancellation(workflowId: string): Promise<void>
}

export class FileCancellationStore implements CancellationStore {
  constructor(
    private readonly storeDirectory = path.resolve(
      process.env.TRAYCER_CANCELLATION_DIR ?? '.traycer/cancellations',
    ),
  ) {}

  async requestCancellation(
    payload: CancellationPayload,
  ): Promise<CancellationRecord> {
    await mkdir(this.storeDirectory, { recursive: true })

    const existing = await this.getCancellation(payload.workflowId)

    if (existing) {
      return existing
    }

    const record: CancellationRecord = {
      ...payload,
      requestedAt: new Date().toISOString(),
    }

    await writeFile(
      this.cancellationPath(payload.workflowId),
      JSON.stringify(record, null, 2),
      { flag: 'wx' },
    ).catch(async (error) => {
      if (isAlreadyExists(error)) {
        const racedRecord = await this.getCancellation(payload.workflowId)

        if (racedRecord) {
          return
        }
      }

      throw error
    })

    return (await this.getCancellation(payload.workflowId)) ?? record
  }

  async isCancellationRequested(workflowId: string): Promise<boolean> {
    return stat(this.cancellationPath(workflowId))
      .then(() => true)
      .catch((error) => {
        if (isMissing(error)) {
          return false
        }

        throw error
      })
  }

  async getCancellation(
    workflowId: string,
  ): Promise<CancellationRecord | undefined> {
    return readFile(this.cancellationPath(workflowId), 'utf8')
      .then((content) => JSON.parse(content) as CancellationRecord)
      .catch((error) => {
        if (isMissing(error)) {
          return undefined
        }

        throw error
      })
  }

  async clearCancellation(workflowId: string): Promise<void> {
    await rm(this.cancellationPath(workflowId), { force: true })
  }

  private cancellationPath(workflowId: string): string {
    return path.join(this.storeDirectory, `${safeFileName(workflowId)}.json`)
  }
}

const defaultCancellationStore = new FileCancellationStore()

export function createFileCancellationStore(
  storeDirectory?: string,
): FileCancellationStore {
  return new FileCancellationStore(storeDirectory)
}

export async function requestCancellation(
  workflowId: string,
  reason?: string,
  store: CancellationStore = defaultCancellationStore,
): Promise<CancellationRecord> {
  return store.requestCancellation({ workflowId, reason })
}

export async function isCancellationRequested(
  workflowId: string,
  store: CancellationStore = defaultCancellationStore,
): Promise<boolean> {
  return store.isCancellationRequested(workflowId)
}

function safeFileName(input: string): string {
  return input.replace(/[^A-Za-z0-9_.-]/gu, '_')
}

function isMissing(error: unknown): boolean {
  return (
    error instanceof Error && 'code' in error && String(error.code) === 'ENOENT'
  )
}

function isAlreadyExists(error: unknown): boolean {
  return (
    error instanceof Error && 'code' in error && String(error.code) === 'EEXIST'
  )
}
