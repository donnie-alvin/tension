import {
  Spec,
  SpecListResponseSchema,
  SpecSchema,
  Ticket,
  TicketListResponseSchema,
  TicketSchema,
  TicketStatus,
} from '@traycer/shared'
import { apiFetch } from '../client'

export function getSpecs(projectId: string): Promise<Spec[]> {
  return apiFetch<unknown>(`/projects/${projectId}/specs`).then((data) =>
    SpecListResponseSchema.parse(data),
  )
}

export function getSpec(id: string): Promise<Spec> {
  return apiFetch<unknown>(`/specs/${id}`).then((data) =>
    SpecSchema.parse(data),
  )
}

export function getTickets(projectId: string): Promise<Ticket[]> {
  return apiFetch<unknown>(`/projects/${projectId}/tickets`).then((data) =>
    TicketListResponseSchema.parse(data),
  )
}

export function getTicket(id: string): Promise<Ticket> {
  return apiFetch<unknown>(`/tickets/${id}`).then((data) =>
    TicketSchema.parse(data),
  )
}

export function updateTicketStatus(
  id: string,
  status: TicketStatus,
): Promise<Ticket> {
  return apiFetch<unknown>(`/tickets/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }).then((data) => TicketSchema.parse(data))
}
