'use client'

import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'
import { routes } from '@traycer/shared'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useProjects } from '@/lib/queries/projects'

export default function ExecutionsIndexPage() {
  const projects = useProjects()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Executions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Open a project to review its execution history.
        </p>
      </div>

      {projects.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(projects.data ?? []).map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-4 w-4" />
                  {project.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href={routes.executions(project.id)}>
                    View executions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
