import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InMemoryRepoIndexStore,
  indexRepository,
} from '../../packages/repo-indexer/src/indexer'

test('incremental indexing skips unchanged files by content hash', async () => {
  const repoPath = await mkdtemp(path.join(tmpdir(), 'traycer-repo-'))

  try {
    await mkdir(path.join(repoPath, 'src'))
    await writeFile(
      path.join(repoPath, 'src', 'index.ts'),
      'export function answer() {\n  return 42\n}\n',
    )

    const store = new InMemoryRepoIndexStore()
    const request = {
      projectId: randomUUID(),
      repoPath,
      maxFiles: 10,
    }
    const firstResult = await indexRepository(request, store)
    const secondResult = await indexRepository(request, store)

    assert.equal(firstResult.filesIndexed, 1)
    assert.equal(firstResult.filesSkipped, 0)
    assert.equal(firstResult.chunksIndexed > 0, true)
    assert.equal(secondResult.filesIndexed, 0)
    assert.equal(secondResult.filesSkipped, 1)
    assert.equal(secondResult.chunksIndexed, 0)
    assert.equal(secondResult.files[0]?.reason, 'unchanged')
  } finally {
    await rm(repoPath, { recursive: true, force: true })
  }
})
