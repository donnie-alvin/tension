import { Spec, Ticket, TicketStatus } from '@traycer/shared'
import { apiFetch } from './client'

export function getSpecs(projectId: string): Promise<Spec[]> {
  return apiFetch<Spec[]>(`/projects/${projectId}/specs`)
}

export function getSpec(id: string): Promise<Spec> {
  return apiFetch<Spec>(`/specs/${id}`)
}

export function getTickets(projectId: string): Promise<Ticket[]> {
  return apiFetch<Ticket[]>(`/projects/${projectId}/tickets`)
}

export function getTicket(id: string): Promise<Ticket> {
  return apiFetch<Ticket>(`/tickets/${id}`)
}

export function updateTicketStatus(
  id: string,
  status: TicketStatus,
): Promise<Ticket> {
  return apiFetch<Ticket>(`/tickets/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
