import { Suspense } from 'react'
import { ProjectList } from '@/components/projects/ProjectList'
import { ProjectListSkeleton } from '@/components/projects/ProjectListSkeleton'

export const dynamic = 'force-dynamic'

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage workspaces, generated artifacts, and execution history.
        </p>
      </div>
      <Suspense fallback={<ProjectListSkeleton />}>
        <ProjectList />
      </Suspense>
    </div>
  )
}
