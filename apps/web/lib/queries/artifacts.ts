'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ticket, TicketStatus } from '@traycer/shared'
import {
  getSpec,
  getSpecs,
  getTicket,
  getTickets,
  updateTicketStatus,
} from '@/lib/api/artifacts'

export const artifactKeys = {
  specs: (projectId: string) => ['specs', projectId] as const,
  spec: (id: string) => ['spec', id] as const,
  tickets: (projectId: string) => ['tickets', projectId] as const,
  ticket: (id: string) => ['ticket', id] as const,
}

export function useSpecs(projectId: string) {
  return useQuery({
    queryKey: artifactKeys.specs(projectId),
    queryFn: () => getSpecs(projectId),
    enabled: Boolean(projectId),
  })
}

export function useSpec(id: string) {
  return useQuery({
    queryKey: artifactKeys.spec(id),
    queryFn: () => getSpec(id),
    enabled: Boolean(id),
  })
}

export function useTickets(projectId: string) {
  return useQuery({
    queryKey: artifactKeys.tickets(projectId),
    queryFn: () => getTickets(projectId),
    enabled: Boolean(projectId),
  })
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: artifactKeys.ticket(id),
    queryFn: () => getTicket(id),
    enabled: Boolean(id),
  })
}

interface UpdateTicketStatusInput {
  id: string
  projectId: string
  status: TicketStatus
}

interface UpdateTicketStatusContext {
  previousTickets?: Ticket[]
  previousTicket?: Ticket
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient()

  return useMutation<
    Ticket,
    Error,
    UpdateTicketStatusInput,
    UpdateTicketStatusContext
  >({
    mutationFn: ({ id, status }) => updateTicketStatus(id, status),
    onMutate: async ({ id, projectId, status }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: artifactKeys.tickets(projectId) }),
        queryClient.cancelQueries({ queryKey: artifactKeys.ticket(id) }),
      ])

      const previousTickets = queryClient.getQueryData<Ticket[]>(
        artifactKeys.tickets(projectId),
      )
      const previousTicket = queryClient.getQueryData<Ticket>(
        artifactKeys.ticket(id),
      )

      queryClient.setQueryData<Ticket[]>(
        artifactKeys.tickets(projectId),
        (current) =>
          current?.map((ticket) =>
            ticket.id === id
              ? { ...ticket, status, updatedAt: new Date().toISOString() }
              : ticket,
          ),
      )

      queryClient.setQueryData<Ticket>(artifactKeys.ticket(id), (current) =>
        current
          ? { ...current, status, updatedAt: new Date().toISOString() }
          : current,
      )

      return { previousTickets, previousTicket }
    },
    onError: (_error, { id, projectId }, context) => {
      if (context?.previousTickets) {
        queryClient.setQueryData(
          artifactKeys.tickets(projectId),
          context.previousTickets,
        )
      }
      if (context?.previousTicket) {
        queryClient.setQueryData(artifactKeys.ticket(id), context.previousTicket)
      }
    },
    onSettled: (_data, _error, { id, projectId }) => {
      void queryClient.invalidateQueries({
        queryKey: artifactKeys.tickets(projectId),
      })
      void queryClient.invalidateQueries({ queryKey: artifactKeys.ticket(id) })
    },
  })
}
