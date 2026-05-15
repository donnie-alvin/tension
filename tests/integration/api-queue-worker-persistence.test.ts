import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import test from 'node:test'

import { createApiRuntime } from '../../apps/api/src'
import { FileIndexingQueue } from '../../packages/repo-indexer/src/api'
import { InMemoryRepoIndexStore } from '../../packages/repo-indexer/src/indexer'
import { processNextIndexingJob } from '../../packages/repo-indexer/src/workers'

test('minimal API to queue to worker flow persists indexed chunks', async () => {
  const repoPath = await mkdtemp(path.join(tmpdir(), 'traycer-flow-repo-'))
  const queuePath = await mkdtemp(path.join(tmpdir(), 'traycer-flow-queue-'))
  let api: ReturnType<typeof createApiRuntime> | undefined

  try {
    await mkdir(path.join(repoPath, 'src'))
    await writeFile(
      path.join(repoPath, 'src', 'flow.ts'),
      [
        "import { strict as assert } from 'node:assert'",
        'export function runFlow() {',
        "  assert.equal('api', 'api')",
        '}',
      ].join('\n'),
    )

    const projectId = randomUUID()
    const queue = new FileIndexingQueue(queuePath)
    const store = new InMemoryRepoIndexStore()
    api = createApiRuntime({ port: 0, queue })
    const { host, port } = await api.start()
    const response = await fetch(`http://${host}:${port}/repo-indexes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        projectId,
        repoPath,
        workflowId: 'workflow-flow',
        requestId: 'request-flow',
        maxFiles: 10,
      }),
    })
    const receipt = (await response.json()) as { status: string }
    const result = await processNextIndexingJob({
      queue,
      store,
      isCancelled: async () => false,
    })
    const chunks = await store.listChunks(projectId)

    assert.equal(receipt.status, 'queued')
    assert.equal(result?.filesIndexed, 1)
    assert.equal(result?.chunksIndexed, chunks.length)
    assert.equal(chunks.length > 0, true)
    assert.equal(chunks[0]?.filePath, 'src/flow.ts')
  } finally {
    await api?.close()
    await rm(repoPath, { recursive: true, force: true })
    await rm(queuePath, { recursive: true, force: true })
  }
})
