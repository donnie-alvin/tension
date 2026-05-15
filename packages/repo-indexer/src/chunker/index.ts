import type { ExtractedSymbol, ParsedFile, RepoChunk } from '../types'

export const defaultChunkingPolicy = {
  maxChunkTokens: 800,
  overlapTokens: 80,
} as const

export interface ChunkingPolicy {
  maxChunkTokens: number
  overlapTokens: number
}

export function estimateTokenCount(input: string): number {
  const trimmed = input.trim()

  if (!trimmed) {
    return 0
  }

  return Math.max(1, Math.ceil(trimmed.length / 4))
}

export function chunkParsedFile(
  file: ParsedFile,
  policy: ChunkingPolicy = defaultChunkingPolicy,
  symbols: ExtractedSymbol[] = [],
): RepoChunk[] {
  const lines = file.content.split(/\r?\n/u)
  const chunks: RepoChunk[] = []
  const covered = new Set<number>()

  for (const symbol of symbols
    .filter((item) => item.endLine && item.endLine >= item.line)
    .sort((left, right) => left.line - right.line)) {
    const startLine = clampLine(symbol.line, lines.length)
    const endLine = clampLine(symbol.endLine ?? symbol.line, lines.length)
    const content = lines.slice(startLine - 1, endLine).join('\n')

    for (let line = startLine; line <= endLine; line += 1) {
      covered.add(line)
    }

    chunks.push(
      ...splitChunkContent({
        chunkType: 'symbol',
        symbolName: symbol.name,
        content,
        startLine,
        maxChunkTokens: policy.maxChunkTokens,
      }),
    )
  }

  const semanticBlocks = collectSemanticBlocks(lines, covered)
  for (const block of semanticBlocks) {
    chunks.push(
      ...splitChunkContent({
        chunkType: 'file',
        content: block.content,
        startLine: block.startLine,
        maxChunkTokens: policy.maxChunkTokens,
      }),
    )
  }

  if (chunks.length === 0 && file.content.trim()) {
    chunks.push(
      ...splitChunkContent({
        chunkType: 'file',
        content: file.content,
        startLine: 1,
        maxChunkTokens: policy.maxChunkTokens,
      }),
    )
  }

  return chunks
    .filter((chunk) => chunk.content.trim())
    .sort((left, right) => left.startLine - right.startLine)
    .map((chunk, chunkIndex) => ({ ...chunk, chunkIndex }))
}

function collectSemanticBlocks(
  lines: string[],
  covered: Set<number>,
): Array<{ startLine: number; content: string }> {
  const blocks: Array<{ startLine: number; lines: string[] }> = []
  let current: { startLine: number; lines: string[] } | undefined

  lines.forEach((line, index) => {
    const lineNumber = index + 1
    const isBoundary =
      covered.has(lineNumber) ||
      (line.trim() === '' && current && current.lines.length > 0)

    if (isBoundary) {
      if (current && current.lines.some((item) => item.trim())) {
        blocks.push(current)
      }
      current = undefined
      return
    }

    if (!current) {
      current = { startLine: lineNumber, lines: [] }
    }

    current.lines.push(line)
  })

  if (current && current.lines.some((item) => item.trim())) {
    blocks.push(current)
  }

  return blocks.map((block) => ({
    startLine: block.startLine,
    content: block.lines.join('\n'),
  }))
}

function splitChunkContent(input: {
  chunkType: 'file' | 'symbol'
  symbolName?: string
  content: string
  startLine: number
  maxChunkTokens: number
}): RepoChunk[] {
  const lines = input.content.split(/\r?\n/u)
  const chunks: RepoChunk[] = []
  let currentLines: string[] = []
  let currentStartLine = input.startLine
  let tokenCount = 0

  function flush(endLine: number): void {
    if (currentLines.length === 0) {
      return
    }

    const content = currentLines.join('\n')
    chunks.push({
      chunkIndex: chunks.length,
      chunkType: input.chunkType,
      symbolName: input.symbolName,
      content,
      startLine: currentStartLine,
      endLine,
      tokenCount: estimateTokenCount(content),
    })
    currentLines = []
    tokenCount = 0
  }

  lines.forEach((line, index) => {
    const lineNumber = input.startLine + index
    const lineTokens = estimateTokenCount(line)

    if (lineTokens > input.maxChunkTokens) {
      flush(lineNumber - 1)
      for (const part of splitLongLine(line, input.maxChunkTokens)) {
        chunks.push({
          chunkIndex: chunks.length,
          chunkType: input.chunkType,
          symbolName: input.symbolName,
          content: part,
          startLine: lineNumber,
          endLine: lineNumber,
          tokenCount: estimateTokenCount(part),
        })
      }
      return
    }

    if (currentLines.length > 0 && tokenCount + lineTokens > input.maxChunkTokens) {
      flush(lineNumber - 1)
    }

    if (currentLines.length === 0) {
      currentStartLine = lineNumber
    }

    currentLines.push(line)
    tokenCount += lineTokens
  })

  flush(input.startLine + lines.length - 1)

  return chunks
}

function splitLongLine(line: string, maxChunkTokens: number): string[] {
  const maxCharacters = Math.max(1, maxChunkTokens * 4)
  const parts: string[] = []

  for (let index = 0; index < line.length; index += maxCharacters) {
    parts.push(line.slice(index, index + maxCharacters))
  }

  return parts
}

function clampLine(line: number, lineCount: number): number {
  return Math.min(Math.max(line, 1), Math.max(lineCount, 1))
}
