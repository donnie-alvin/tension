import { estimateTokenCount } from '../chunker'
import type {
  RepoIndexStore,
  RetrievalBudget,
  RetrievalCandidate,
  RetrievalResult,
  StoredRepoChunk,
} from '../types'

export const defaultRetrievalBudget: RetrievalBudget = {
  maxChunks: 12,
  maxTokens: 6_000,
}

export function selectChunksWithinBudget(
  candidates: RetrievalCandidate[],
  budget: RetrievalBudget = defaultRetrievalBudget,
): RetrievalResult {
  if (budget.maxChunks < 1 || budget.maxTokens < 1) {
    throw new Error('Retrieval budget must allow at least one chunk and token')
  }

  const selected: StoredRepoChunk[] = []
  let tokenCount = 0

  for (const candidate of [...candidates].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score
    }

    return left.chunk.filePath.localeCompare(right.chunk.filePath)
  })) {
    if (selected.length >= budget.maxChunks) {
      break
    }

    const chunkTokenCount =
      candidate.chunk.tokenCount || estimateTokenCount(candidate.chunk.content)

    if (tokenCount + chunkTokenCount > budget.maxTokens) {
      continue
    }

    selected.push({ ...candidate.chunk, tokenCount: chunkTokenCount })
    tokenCount += chunkTokenCount
  }

  return {
    chunks: selected,
    tokenCount,
    budget,
  }
}

export async function retrieveIndexedChunks(
  store: RepoIndexStore,
  input: {
    projectId: string
    query: string
    budget?: RetrievalBudget
  },
): Promise<RetrievalResult> {
  const queryTerms = input.query.toLowerCase().split(/\W+/u).filter(Boolean)
  const chunks = await store.listChunks(input.projectId)
  const candidates = chunks.map((chunk) => ({
    chunk,
    score: scoreChunk(chunk, queryTerms),
  }))

  return selectChunksWithinBudget(candidates, input.budget)
}

function scoreChunk(chunk: StoredRepoChunk, queryTerms: string[]): number {
  const haystack =
    `${chunk.filePath}\n${chunk.symbolName ?? ''}\n${chunk.content}`
      .toLowerCase()
      .trim()

  if (queryTerms.length === 0) {
    return 0
  }

  return queryTerms.reduce(
    (score, term) => score + (haystack.includes(term) ? 1 : 0),
    0,
  )
}
