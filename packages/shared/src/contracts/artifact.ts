import { z } from 'zod'
import { ArtifactKind, TicketStatus } from '../types/artifact'

export const SpecSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1),
  content: z.string(),
  kind: z.literal(ArtifactKind.Spec),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const TicketSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  specId: z.string().min(1).optional(),
  title: z.string().min(1),
  description: z.string(),
  status: z.nativeEnum(TicketStatus),
  kind: z.literal(ArtifactKind.Ticket),
  assigneeId: z.string().min(1).optional(),
  assigneeName: z.string().min(1).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const UpdateTicketStatusSchema = z.object({
  status: z.nativeEnum(TicketStatus),
})

export const SpecListResponseSchema = z.array(SpecSchema)
export const TicketListResponseSchema = z.array(TicketSchema)
export type UpdateTicketStatusInput = z.infer<typeof UpdateTicketStatusSchema>
