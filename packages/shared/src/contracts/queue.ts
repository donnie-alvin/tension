import { z } from 'zod'

export const IdempotentJobSchema = z.object({
  idempotencyKey: z.string().min(1),
  workflowId: z.string().min(1),
  payload: z.record(z.unknown()),
  requestedBy: z.string().min(1),
})

export const CancellationPayloadSchema = z.object({
  workflowId: z.string().min(1),
  reason: z.string().min(1).optional(),
})

export type IdempotentJobPayload = z.infer<typeof IdempotentJobSchema>
export type CancellationPayload = z.infer<typeof CancellationPayloadSchema>
