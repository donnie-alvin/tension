'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'
import { ExecutionState, formatDate, routes } from '@traycer/shared'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useExecutions } from '@/lib/queries/executions'
import { useProject } from '@/lib/queries/projects'
import { cn } from '@/lib/utils'

interface ProjectExecutionsPageProps {
  params: Promise<{
    projectId: string
  }>
}

const executionStateClasses: Record<ExecutionState, string> = {
  [ExecutionState.Queued]: 'border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300',
  [ExecutionState.Running]: 'border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-300',
  [ExecutionState.Succeeded]: 'border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300',
  [ExecutionState.Failed]: 'border-red-300 text-red-700 dark:border-red-800 dark:text-red-300',
  [ExecutionState.Cancelled]: 'border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300',
}

export default function ProjectExecutionsPage({
  params,
}: ProjectExecutionsPageProps) {
  const { projectId } = use(params)
  const project = useProject(projectId)
  const executions = useExecutions(projectId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Executions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {project.data?.name ?? 'Project execution history'}
        </p>
      </div>

      {executions.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (executions.data ?? []).length > 0 ? (
        <div className="space-y-3">
          {(executions.data ?? []).map((execution) => (
            <Link
              key={execution.id}
              href={routes.execution(projectId, execution.id)}
              className="block"
            >
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Zap className="h-4 w-4" />
                    {execution.title}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={cn(executionStateClasses[execution.state])}
                  >
                    {execution.state}
                  </Badge>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
                  <span>{execution.summary}</span>
                  <span className="shrink-0">{formatDate(execution.updatedAt)}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed text-center">
          <Zap className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No executions found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This project does not have execution history yet.
          </p>
        </div>
      )}
    </div>
  )
}
