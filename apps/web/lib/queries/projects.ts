'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Project } from '@traycer/shared'
import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  type CreateProjectInput,
} from '@/lib/api/projects'

export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
}

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: getProjects,
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => getProject(id),
    enabled: Boolean(id),
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation<Project, Error, CreateProjectInput>({
    mutationFn: createProject,
    onSuccess: (project) => {
      queryClient.setQueryData<Project[]>(projectKeys.all, (current) =>
        current ? [project, ...current] : [project],
      )
      queryClient.setQueryData(projectKeys.detail(project.id), project)
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: deleteProject,
    onSuccess: (_result, id) => {
      queryClient.setQueryData<Project[]>(projectKeys.all, (current) =>
        current?.filter((project) => project.id !== id),
      )
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) })
    },
  })
}
