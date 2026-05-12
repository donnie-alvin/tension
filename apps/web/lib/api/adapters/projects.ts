import {
  Project,
  ProjectListResponseSchema,
  ProjectSchema,
} from '@traycer/shared'
import type { CreateProjectInput, UpdateProjectInput } from '@traycer/shared'
import { apiFetch } from '../client'

export type { CreateProjectInput, UpdateProjectInput }

export function getProjects(): Promise<Project[]> {
  return apiFetch<unknown>('/projects').then((data) =>
    ProjectListResponseSchema.parse(data),
  )
}

export function getProject(id: string): Promise<Project> {
  return apiFetch<unknown>(`/projects/${id}`).then((data) =>
    ProjectSchema.parse(data),
  )
}

export function createProject(input: CreateProjectInput): Promise<Project> {
  return apiFetch<unknown>('/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((data) => ProjectSchema.parse(data))
}

export function updateProject(
  id: string,
  input: UpdateProjectInput,
): Promise<Project> {
  return apiFetch<unknown>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  }).then((data) => ProjectSchema.parse(data))
}

export function deleteProject(id: string): Promise<void> {
  return apiFetch<void>(`/projects/${id}`, {
    method: 'DELETE',
  })
}
