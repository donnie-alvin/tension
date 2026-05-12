export interface ModelRoute {
  task: 'planning' | 'review' | 'summarization' | 'retrieval' | 'verification'
  model: string
  maxContextTokens: number
}
