'use client'

import { useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FileText } from 'lucide-react'
import { TicketStatus } from '@traycer/shared'
import { SpecCard } from '@/components/artifacts/SpecCard'
import { TicketCard } from '@/components/artifacts/TicketCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSpecs, useTickets } from '@/lib/queries/artifacts'

interface ArtifactTabsProps {
  projectId: string
  activeTab: string
  searchQuery: string
  statusFilter: string
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border p-4">
      <Skeleton className="h-5 w-5 rounded-full" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-24" />
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed text-center">
      <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Adjust the search or filter controls to broaden the results.
      </p>
    </div>
  )
}

export function ArtifactTabs({
  projectId,
  activeTab,
  searchQuery,
  statusFilter,
}: ArtifactTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const specs = useSpecs(projectId)
  const tickets = useTickets(projectId)
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filteredSpecs = useMemo(() => {
    return (specs.data ?? []).filter((spec) =>
      spec.title.toLowerCase().includes(normalizedQuery),
    )
  }, [normalizedQuery, specs.data])

  const filteredTickets = useMemo(() => {
    return (tickets.data ?? []).filter((ticket) => {
      const matchesQuery =
        ticket.title.toLowerCase().includes(normalizedQuery) ||
        ticket.id.toLowerCase().includes(normalizedQuery)
      const matchesStatus =
        statusFilter === '' || ticket.status === (statusFilter as TicketStatus)

      return matchesQuery && matchesStatus
    })
  }, [normalizedQuery, statusFilter, tickets.data])

  function onTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
      <TabsList>
        <TabsTrigger value="tickets">Tickets</TabsTrigger>
        <TabsTrigger value="specs">Specs</TabsTrigger>
      </TabsList>

      <TabsContent value="tickets" className="space-y-3">
        {tickets.isLoading ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => (
            <TicketCard key={ticket.id} projectId={projectId} ticket={ticket} />
          ))
        ) : (
          <EmptyState label="No tickets found" />
        )}
      </TabsContent>

      <TabsContent value="specs" className="space-y-3">
        {specs.isLoading ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : filteredSpecs.length > 0 ? (
          filteredSpecs.map((spec) => (
            <SpecCard key={spec.id} projectId={projectId} spec={spec} />
          ))
        ) : (
          <EmptyState label="No specs found" />
        )}
      </TabsContent>
    </Tabs>
  )
}
