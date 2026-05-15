import { estimateTokenCount } from '../chunker'
import type { FileSummary, ParsedFile } from '../types'

export const deterministicSummaryModel = 'deterministic-local-summary-v1'

export function summarizeFile(file: ParsedFile, maxTokens = 120): FileSummary {
  const meaningfulLines = file.content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const firstLine = meaningfulLines[0] ?? `${file.filePath} is empty.`
  let summary = `${file.filePath}: ${firstLine}`

  while (estimateTokenCount(summary) > maxTokens && summary.length > 20) {
    summary = summary.slice(0, Math.floor(summary.length * 0.8)).trim()
  }

  return {
    summary,
    model: deterministicSummaryModel,
  }
}
