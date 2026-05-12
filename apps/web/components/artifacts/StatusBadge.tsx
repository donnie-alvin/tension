import { TicketStatus, ticketStatusClasses, ticketStatusLabels } from '@traycer/shared'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: TicketStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(ticketStatusClasses[status])}>
      {ticketStatusLabels[status]}
    </Badge>
  )
}
