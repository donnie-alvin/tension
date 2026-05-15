import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import test from 'node:test'

import { createIdempotentJobOptions } from '../../packages/queue/src/jobs/options'
import {
  createFileCancellationStore,
  isCancellationRequested,
  requestCancellation,
} from '../../packages/queue/src/scheduling/cancellation'

test('idempotent job options keep retries bounded and stable', () => {
  const options = createIdempotentJobOptions('workflow-1:index')

  assert.equal(options.jobId, 'workflow-1:index')
  assert.equal(options.attempts, 3)
  assert.deepEqual(options.backoff, { type: 'exponential', delay: 1_000 })
  assert.equal(options.removeOnComplete, true)
  assert.equal(options.removeOnFail, false)
})

test('file cancellation store shares durable state across instances', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'traycer-cancel-'))

  try {
    const firstStore = createFileCancellationStore(directory)
    const secondStore = createFileCancellationStore(directory)

    await requestCancellation('workflow-1', 'user requested stop', firstStore)

    assert.equal(await isCancellationRequested('workflow-1', secondStore), true)

    await secondStore.clearCancellation('workflow-1')

    assert.equal(await isCancellationRequested('workflow-1', firstStore), false)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
