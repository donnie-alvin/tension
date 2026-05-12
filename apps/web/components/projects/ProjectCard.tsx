'use client'

import Link from 'next/link'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import {
  formatRelativeDate,
  projectStatusClasses,
  projectStatusLabels,
  Project,
  routes,
} from '@traycer/shared'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDeleteProject } from '@/lib/queries/projects'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const deleteProject = useDeleteProject()

  return (
    <Link href={routes.project(project.id)} className="block h-full">
      <Card className="flex h-full cursor-pointer flex-col transition-colors hover:border-zinc-600">
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <CardTitle className="line-clamp-1 text-base font-semibold">
            {project.name}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="-mr-2 -mt-2 h-8 w-8 shrink-0"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open project menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  toast.info('Project editing is not available in mock mode')
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                disabled={deleteProject.isPending}
                onSelect={(event) => {
                  event.preventDefault()
                  deleteProject.mutate(project.id, {
                    onSuccess: () => toast.success('Project deleted'),
                  })
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {project.description}
          </p>
          <Badge variant="secondary">{project.artifactCount} artifacts</Badge>
        </CardContent>
        <CardFooter className="justify-between gap-4">
          <Badge
            variant="outline"
            className={cn(projectStatusClasses[project.status])}
          >
            {projectStatusLabels[project.status]}
          </Badge>
          <span className="truncate text-xs text-muted-foreground">
            Updated {formatRelativeDate(project.updatedAt)}
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
}
