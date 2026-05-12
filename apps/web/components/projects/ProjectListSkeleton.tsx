import { ProjectCardSkeleton } from '@/components/projects/ProjectCardSkeleton'

export function ProjectListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ProjectCardSkeleton />
      <ProjectCardSkeleton />
      <ProjectCardSkeleton />
    </div>
  )
}
