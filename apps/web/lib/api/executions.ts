import { Execution } from '@traycer/shared'
import { apiFetch } from './client'

export function getExecutions(projectId: string): Promise<Execution[]> {
  return apiFetch<Execution[]>(`/projects/${projectId}/executions`)
}

export function getExecution(id: string): Promise<Execution> {
  return apiFetch<Execution>(`/executions/${id}`)
}
