export interface RetrievalBudget {
  maxChunks: number
  maxTokens: number
}

export const defaultRetrievalBudget: RetrievalBudget = {
  maxChunks: 12,
  maxTokens: 6_000,
}
