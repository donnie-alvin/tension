import { Project } from '@traycer/shared'
import { apiFetch } from './client'

export type CreateProjectInput = Pick<
  Project,
  'name' | 'description' | 'status'
>

export type UpdateProjectInput = Partial<CreateProjectInput>

export function getProjects(): Promise<Project[]> {
  return apiFetch<Project[]>('/projects')
}

export function getProject(id: string): Promise<Project> {
  return apiFetch<Project>(`/projects/${id}`)
}

export function createProject(input: CreateProjectInput): Promise<Project> {
  return apiFetch<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateProject(
  id: string,
  input: UpdateProjectInput,
): Promise<Project> {
  return apiFetch<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteProject(id: string): Promise<void> {
  return apiFetch<void>(`/projects/${id}`, {
    method: 'DELETE',
  })
}
