import { JobsOptions } from 'bullmq'

export interface IdempotentJobOptions extends JobsOptions {
  jobId: string
  removeOnComplete: true
}

export function createIdempotentJobOptions(
  idempotencyKey: string,
): IdempotentJobOptions {
  return {
    jobId: idempotencyKey,
    attempts: 3,
    backoff: { type: 'exponential', delay: 1_000 },
    removeOnComplete: true,
    removeOnFail: false,
  }
}
