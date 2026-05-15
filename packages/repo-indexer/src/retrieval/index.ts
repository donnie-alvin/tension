import { estimateTokenCount } from '../chunker'
import {
  cosineSimilarity,
  createEmbeddingProvider,
  createDeterministicEmbedding,
  embedTexts,
} from '../embedder'
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
    dependencyExpansion?: number
  },
): Promise<RetrievalResult> {
  const symbols = await store.listSymbols(input.projectId)
  const edges = await store.listDependencyEdges(input.projectId)
  const provider = createEmbeddingProvider()
  const [queryEmbedding] = await embedTexts([input.query], provider).catch(() => [
    createDeterministicEmbedding(input.query),
  ])
  const queryTerms = tokenize(input.query)
  const symbolNames = new Set(
    symbols
      .filter((symbol) => symbol.name && queryTerms.includes(symbol.name.toLowerCase()))
      .map((symbol) => symbol.name?.toLowerCase()),
  )
  const dependencyBoosts = dependencyBoostByFile(edges, input.dependencyExpansion ?? 1)
  const semanticCandidates = store.semanticSearchChunks
    ? await store.semanticSearchChunks(
        input.projectId,
        queryEmbedding,
        Math.max((input.budget ?? defaultRetrievalBudget).maxChunks * 8, 50),
      )
    : undefined
  const chunks = semanticCandidates
    ? semanticCandidates.map((candidate) => candidate.chunk)
    : await store.listChunks(input.projectId)
  const semanticScoreByChunkId = new Map(
    semanticCandidates?.map((candidate) => [candidate.chunk.id, candidate.score]) ??
      [],
  )

  const candidates = chunks.map((chunk) => {
    const semanticScore =
      semanticScoreByChunkId.get(chunk.id) ??
      (chunk.embedding ? cosineSimilarity(queryEmbedding, chunk.embedding) : 0)
    const lexicalScore = lexicalOverlapScore(chunk, queryTerms)
    const symbolScore =
      chunk.symbolName && symbolNames.has(chunk.symbolName.toLowerCase()) ? 0.35 : 0
    const dependencyScore = dependencyBoosts.get(chunk.filePath) ?? 0

    return {
      chunk,
      score: semanticScore * 0.55 + lexicalScore * 0.3 + symbolScore + dependencyScore,
    }
  })

  return selectChunksWithinBudget(candidates, input.budget)
}

function lexicalOverlapScore(chunk: StoredRepoChunk, queryTerms: string[]): number {
  if (queryTerms.length === 0) {
    return 0
  }

  const haystack = tokenize(
    `${chunk.filePath} ${chunk.symbolName ?? ''} ${chunk.content}`,
  )
  const haystackSet = new Set(haystack)
  const matches = queryTerms.filter((term) => haystackSet.has(term)).length

  return matches / queryTerms.length
}

function dependencyBoostByFile(
  edges: Awaited<ReturnType<RepoIndexStore['listDependencyEdges']>>,
  expansion: number,
): Map<string, number> {
  const boosts = new Map<string, number>()

  if (expansion < 1) {
    return boosts
  }

  for (const edge of edges) {
    if (edge.resolvedFilePath) {
      boosts.set(edge.sourceFilePath, Math.max(boosts.get(edge.sourceFilePath) ?? 0, 0.08))
      boosts.set(edge.resolvedFilePath, Math.max(boosts.get(edge.resolvedFilePath) ?? 0, 0.05))
    }
  }

  return boosts
}

function tokenize(input: string): string[] {
  return input.toLowerCase().match(/[a-z0-9_$]+/gu) ?? []
}
