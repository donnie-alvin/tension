import Link from 'next/link'
import { ChevronRight, FileText } from 'lucide-react'
import { formatRelativeDate, routes, Spec } from '@traycer/shared'

interface SpecCardProps {
  projectId: string
  spec: Spec
}

export function SpecCard({ projectId, spec }: SpecCardProps) {
  return (
    <Link
      href={routes.spec(projectId, spec.id)}
      className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
    >
      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate font-medium">{spec.title}</span>
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {formatRelativeDate(spec.updatedAt)}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}
