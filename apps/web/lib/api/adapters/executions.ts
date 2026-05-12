import {
  Execution,
  ExecutionListResponseSchema,
  ExecutionSchema,
} from '@traycer/shared'
import { apiFetch } from '../client'

export function getExecutions(projectId: string): Promise<Execution[]> {
  return apiFetch<unknown>(`/projects/${projectId}/executions`).then((data) =>
    ExecutionListResponseSchema.parse(data),
  )
}

export function getExecution(id: string): Promise<Execution> {
  return apiFetch<unknown>(`/executions/${id}`).then((data) =>
    ExecutionSchema.parse(data),
  )
}
