'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  formatDate,
  routes,
  TicketStatus,
  ticketStatusLabels,
} from '@traycer/shared'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/artifacts/StatusBadge'
import { TicketDetail } from '@/components/artifacts/TicketDetail'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useTicket,
  useUpdateTicketStatus,
} from '@/lib/queries/artifacts'
import { useProject } from '@/lib/queries/projects'

interface TicketPageProps {
  params: Promise<{
    projectId: string
    ticketId: string
  }>
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs uppercase tracking-normal text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm">{value}</dd>
    </div>
  )
}

export default function TicketPage({ params }: TicketPageProps) {
  const { projectId, ticketId } = use(params)
  const ticket = useTicket(ticketId)
  const project = useProject(projectId)
  const updateStatus = useUpdateTicketStatus()

  if (ticket.isLoading || project.isLoading) {
    return (
      <div className="flex flex-col gap-6 lg:flex-row">
        <main className="min-w-0 flex-1 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-64 w-full" />
        </main>
        <aside className="w-full shrink-0 space-y-4 lg:w-64">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </aside>
      </div>
    )
  }

  if (!ticket.data) {
    return <p className="text-sm text-muted-foreground">Ticket not found.</p>
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <main className="min-w-0 flex-1 space-y-6">
        <Button asChild variant="ghost" className="px-0">
          <Link href={`${routes.artifacts(projectId)}?tab=tickets`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to artifacts
          </Link>
        </Button>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground">
              {ticket.data.id}
            </span>
            <StatusBadge status={ticket.data.status} />
          </div>
          <h1 className="text-2xl font-semibold tracking-normal">
            {ticket.data.title}
          </h1>
        </div>
        <TicketDetail ticket={ticket.data} />
      </main>

      <aside className="w-full shrink-0 space-y-6 rounded-lg border p-4 lg:w-64">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={ticket.data.status}
            disabled={updateStatus.isPending}
            onValueChange={(value) =>
              updateStatus.mutate(
                {
                  id: ticket.data.id,
                  projectId,
                  status: value as TicketStatus,
                },
                {
                  onSuccess: () => toast.success('Ticket status updated'),
                },
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TicketStatus).map((item) => (
                <SelectItem key={item} value={item}>
                  {ticketStatusLabels[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <dl className="space-y-4">
          <MetadataRow
            label="Assignee"
            value={ticket.data.assigneeName ?? 'Unassigned'}
          />
          <MetadataRow
            label="Project"
            value={project.data?.name ?? 'Unknown project'}
          />
          <MetadataRow label="Created" value={formatDate(ticket.data.createdAt)} />
          <MetadataRow label="Updated" value={formatDate(ticket.data.updatedAt)} />
        </dl>
      </aside>
    </div>
  )
}
