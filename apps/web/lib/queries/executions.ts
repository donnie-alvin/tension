'use client'

import { useQuery } from '@tanstack/react-query'
import { getExecution, getExecutions } from '@/lib/api/executions'

export const executionKeys = {
  list: (projectId: string) => ['executions', projectId] as const,
  detail: (id: string) => ['execution', id] as const,
}

export function useExecutions(projectId: string) {
  return useQuery({
    queryKey: executionKeys.list(projectId),
    queryFn: () => getExecutions(projectId),
    enabled: Boolean(projectId),
  })
}

export function useExecution(id: string) {
  return useQuery({
    queryKey: executionKeys.detail(id),
    queryFn: () => getExecution(id),
    enabled: Boolean(id),
  })
}
