import { createHash } from 'node:crypto'

import type { EmbeddedRepoChunk, RepoChunk } from '../types'

export const embeddingDimensions = 1536

export function embedChunks(chunks: RepoChunk[]): EmbeddedRepoChunk[] {
  return chunks.map((chunk) => ({
    ...chunk,
    embedding: createDeterministicEmbedding(chunk.content),
  }))
}

export function createDeterministicEmbedding(input: string): number[] {
  const seed = createHash('sha256').update(input).digest()
  const embedding: number[] = []

  for (let index = 0; index < embeddingDimensions; index += 1) {
    const byte = seed[index % seed.length]
    embedding.push(Number(((byte / 255) * 2 - 1).toFixed(6)))
  }

  return embedding
}
