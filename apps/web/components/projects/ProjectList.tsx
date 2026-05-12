'use client'

import { useState } from 'react'
import { FolderOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectCardSkeleton } from '@/components/projects/ProjectCardSkeleton'
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog'
import { useProjects } from '@/lib/queries/projects'

export function ProjectList() {
  const [createOpen, setCreateOpen] = useState(false)
  const { data, isLoading } = useProjects()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
      </div>
    )
  }

  const projects = data ?? []

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateProjectDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          trigger={
            <Button type="button">
              <Plus className="mr-2 h-4 w-4" />
              Create project
            </Button>
          }
        />
      </div>

      {projects.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FolderOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No projects yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a workspace to start tracking specs, tickets, and executions.
          </p>
          <Button
            type="button"
            className="mt-4"
            onClick={() => setCreateOpen(true)}
          >
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
