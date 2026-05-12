import { z } from 'zod'
import { ProjectStatus } from '../types/project'

export const ProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  status: z.nativeEnum(ProjectStatus),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  artifactCount: z.number().int().nonnegative(),
})

export const CreateProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
})

export const UpdateProjectSchema = CreateProjectSchema.partial()
export const ProjectListResponseSchema = z.array(ProjectSchema)

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>
