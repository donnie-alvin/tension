export interface DeadLetterRecord {
  jobId: string
  queueName: string
  failedAt: string
  reason: string
}

export function createDeadLetterRecord(
  jobId: string,
  queueName: string,
  reason: string,
): DeadLetterRecord {
  return {
    jobId,
    queueName,
    failedAt: new Date().toISOString(),
    reason,
  }
}
