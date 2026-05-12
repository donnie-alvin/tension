export const defaultRetryPolicy = {
  maxAttempts: 3,
  backoffMs: 1_000,
  deadLetterAfterAttempts: 3,
} as const
