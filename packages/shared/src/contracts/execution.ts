import { z } from 'zod'
import { ExecutionPhase, ExecutionState } from '../types/execution'

export const ExecutionSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1),
  phase: z.nativeEnum(ExecutionPhase),
  state: z.nativeEnum(ExecutionState),
  summary: z.string(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const ExecutionListResponseSchema = z.array(ExecutionSchema)
