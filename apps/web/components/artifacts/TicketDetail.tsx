import { Ticket } from '@traycer/shared'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'

interface TicketDetailProps {
  ticket: Ticket
}

export function TicketDetail({ ticket }: TicketDetailProps) {
  return <MarkdownRenderer content={ticket.description} />
}
