export interface TokenUsage {
  workflowId: string
  promptTokens: number
  completionTokens: number
  estimatedCostUsd: number
}
