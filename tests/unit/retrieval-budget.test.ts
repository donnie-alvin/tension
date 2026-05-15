import assert from 'node:assert/strict'
import test from 'node:test'

import { selectChunksWithinBudget } from '../../packages/repo-indexer/src/retrieval'
import type { RetrievalCandidate } from '../../packages/repo-indexer/src/types'

test('retrieval selection enforces max chunk and token budgets', () => {
  const candidates: RetrievalCandidate[] = [
    candidate('a.ts', 0, 20, 3),
    candidate('b.ts', 0, 15, 2),
    candidate('c.ts', 0, 10, 1),
  ]
  const result = selectChunksWithinBudget(candidates, {
    maxChunks: 2,
    maxTokens: 30,
  })

  assert.equal(result.chunks.length, 2)
  assert.equal(result.tokenCount, 30)
  assert.deepEqual(
    result.chunks.map((chunk) => chunk.filePath),
    ['a.ts', 'c.ts'],
  )
  assert.equal(result.tokenCount <= result.budget.maxTokens, true)
  assert.equal(result.chunks.length <= result.budget.maxChunks, true)
})

function candidate(
  filePath: string,
  chunkIndex: number,
  tokenCount: number,
  score: number,
): RetrievalCandidate {
  return {
    score,
    chunk: {
      id: `${filePath}:${chunkIndex}`,
      fileId: filePath,
      filePath,
      chunkIndex,
      chunkType: 'file',
      symbolName: null,
      content: 'x'.repeat(tokenCount * 4),
      startLine: 1,
      endLine: 1,
      tokenCount,
    },
  }
}
