import { z } from 'zod'

export const OrchestrationStepSchema = z.object({
  id: z.string().min(1),
  workflowId: z.string().min(1),
  name: z.string().min(1),
  dependsOn: z.array(z.string().min(1)).default([]),
  retryLimit: z.number().int().min(0).max(5),
})

export const OrchestrationEventSchema = z.object({
  id: z.string().min(1),
  workflowId: z.string().min(1),
  stepId: z.string().min(1).optional(),
  type: z.enum([
    'workflow.started',
    'step.started',
    'step.succeeded',
    'step.failed',
    'workflow.cancelled',
    'workflow.completed',
  ]),
  occurredAt: z.string().datetime(),
  payload: z.record(z.unknown()).default({}),
})

export type OrchestrationStep = z.infer<typeof OrchestrationStepSchema>
export type OrchestrationEvent = z.infer<typeof OrchestrationEventSchema>
