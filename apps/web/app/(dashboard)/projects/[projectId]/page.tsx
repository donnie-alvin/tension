'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowRight, FileText, Zap } from 'lucide-react'
import {
  formatDate,
  projectStatusClasses,
  projectStatusLabels,
  routes,
} from '@traycer/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useProject } from '@/lib/queries/projects'
import { cn } from '@/lib/utils'

interface ProjectPageProps {
  params: Promise<{
    projectId: string
  }>
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = use(params)
  const { data: project, isLoading } = useProject(projectId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    )
  }

  if (!project) {
    return <p className="text-sm text-muted-foreground">Project not found.</p>
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-normal">
            {project.name}
          </h1>
          <Badge
            variant="outline"
            className={cn(projectStatusClasses[project.status])}
          >
            {projectStatusLabels[project.status]}
          </Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {project.description}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Created
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {formatDate(project.createdAt)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {projectStatusLabels[project.status]}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Artifacts
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {project.artifactCount}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              View Artifacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={routes.artifacts(project.id)}>
                Open artifacts
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" />
              View Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={routes.executions(project.id)}>
                Open executions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
