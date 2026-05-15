import type { ParsedFile, RepoChunk } from '../types'

export const defaultChunkingPolicy = {
  maxChunkTokens: 800,
  overlapTokens: 80,
} as const

export function estimateTokenCount(input: string): number {
  const trimmed = input.trim()

  if (!trimmed) {
    return 0
  }

  return Math.max(1, Math.ceil(trimmed.length / 4))
}

export function chunkParsedFile(
  file: ParsedFile,
  policy = defaultChunkingPolicy,
): RepoChunk[] {
  const lines = file.content.split(/\r?\n/)
  const chunks: RepoChunk[] = []
  let currentLines: string[] = []
  let currentStartLine = 1
  let currentTokenCount = 0

  function flush(endLine: number): void {
    if (currentLines.length === 0) {
      return
    }

    const content = currentLines.join('\n')
    chunks.push({
      chunkIndex: chunks.length,
      chunkType: 'file',
      content,
      startLine: currentStartLine,
      endLine,
      tokenCount: estimateTokenCount(content),
    })

    const overlapLines: string[] = []
    let overlapTokens = 0

    for (let index = currentLines.length - 1; index >= 0; index -= 1) {
      const line = currentLines[index]
      const lineTokens = estimateTokenCount(line)

      if (overlapTokens + lineTokens > policy.overlapTokens) {
        break
      }

      overlapLines.unshift(line)
      overlapTokens += lineTokens
    }

    currentLines = overlapLines
    currentStartLine = Math.max(1, endLine - currentLines.length + 1)
    currentTokenCount = estimateTokenCount(currentLines.join('\n'))
  }

  lines.forEach((line, index) => {
    const lineNumber = index + 1
    const lineTokenCount = estimateTokenCount(line)

    if (
      currentLines.length > 0 &&
      currentTokenCount + lineTokenCount > policy.maxChunkTokens
    ) {
      flush(lineNumber - 1)
    }

    if (lineTokenCount > policy.maxChunkTokens) {
      splitLongLine(line, policy.maxChunkTokens).forEach((part) => {
        if (currentLines.length > 0) {
          flush(lineNumber)
        }

        currentLines = [part]
        currentStartLine = lineNumber
        currentTokenCount = estimateTokenCount(part)
        flush(lineNumber)
      })
      return
    }

    if (currentLines.length === 0) {
      currentStartLine = lineNumber
    }

    currentLines.push(line)
    currentTokenCount += lineTokenCount
  })

  flush(lines.length)

  return chunks.map((chunk, chunkIndex) => ({ ...chunk, chunkIndex }))
}

function splitLongLine(line: string, maxChunkTokens: number): string[] {
  const maxCharacters = Math.max(1, maxChunkTokens * 4)
  const parts: string[] = []

  for (let index = 0; index < line.length; index += maxCharacters) {
    parts.push(line.slice(index, index + maxCharacters))
  }

  return parts
}
