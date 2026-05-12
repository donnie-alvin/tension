'use client'

import { use, useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useQueryState } from 'nuqs'
import { TicketStatus, ticketStatusLabels } from '@traycer/shared'
import { ArtifactTabs } from '@/components/artifacts/ArtifactTabs'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useProject } from '@/lib/queries/projects'

interface ArtifactsPageProps {
  params: Promise<{
    projectId: string
  }>
}

export default function ArtifactsPage({ params }: ArtifactsPageProps) {
  const { projectId } = use(params)
  const [tab] = useQueryState('tab', { defaultValue: 'tickets' })
  const [q, setQ] = useQueryState('q', { defaultValue: '' })
  const [status, setStatus] = useQueryState('status', { defaultValue: '' })
  const [debouncedQ, setDebouncedQ] = useState(q)
  const project = useProject(projectId)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQ(q), 300)
    return () => window.clearTimeout(timeout)
  }, [q])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Artifacts</h1>
        {project.isLoading ? (
          <Skeleton className="mt-2 h-4 w-48" />
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            {project.data?.name ?? 'Project artifacts'}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(event) => void setQ(event.target.value)}
            placeholder="Search artifacts"
            className="pl-9"
          />
        </div>
        <Select
          value={status || 'all'}
          onValueChange={(value) => void setStatus(value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {Object.values(TicketStatus).map((item) => (
              <SelectItem key={item} value={item}>
                {ticketStatusLabels[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ArtifactTabs
        projectId={projectId}
        activeTab={tab}
        searchQuery={debouncedQ}
        statusFilter={status}
      />
    </div>
  )
}
