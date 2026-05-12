'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatDate, routes } from '@traycer/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useExecution } from '@/lib/queries/executions'

interface ExecutionPageProps {
  params: Promise<{
    projectId: string
    executionId: string
  }>
}

export default function ExecutionPage({ params }: ExecutionPageProps) {
  const { projectId, executionId } = use(params)
  const execution = useExecution(executionId)

  if (execution.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!execution.data) {
    return <p className="text-sm text-muted-foreground">Execution not found.</p>
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="px-0">
        <Link href={routes.executions(projectId)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to executions
        </Link>
      </Button>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">{execution.data.phase}</Badge>
          <Badge variant="outline">{execution.data.state}</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-normal">
          {execution.data.title}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {execution.data.summary}
          </p>
          <dl className="grid gap-4 text-sm md:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Started</dt>
              <dd>{formatDate(execution.data.startedAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Completed</dt>
              <dd>
                {execution.data.completedAt
                  ? formatDate(execution.data.completedAt)
                  : 'In progress'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Updated</dt>
              <dd>{formatDate(execution.data.updatedAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
