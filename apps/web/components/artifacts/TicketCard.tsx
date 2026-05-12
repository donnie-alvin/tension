import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { formatRelativeDate, routes, Ticket } from '@traycer/shared'
import { StatusBadge } from '@/components/artifacts/StatusBadge'

interface TicketCardProps {
  projectId: string
  ticket: Ticket
}

export function TicketCard({ projectId, ticket }: TicketCardProps) {
  return (
    <Link
      href={routes.ticket(projectId, ticket.id)}
      className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
    >
      <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">
        {ticket.id}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{ticket.title}</span>
      <span className="hidden text-sm text-muted-foreground md:inline">
        {formatRelativeDate(ticket.updatedAt)}
      </span>
      <StatusBadge status={ticket.status} />
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}
