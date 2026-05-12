export interface RetryPolicy {
  maxAttempts: number
  backoffMs: number
}

export const deterministicRetryPolicy: RetryPolicy = {
  maxAttempts: 3,
  backoffMs: 1_000,
}
