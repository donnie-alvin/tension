export enum TicketStatus {
  Todo = 'Todo',
  InProgress = 'InProgress',
  Done = 'Done',
}

export enum ArtifactKind {
  Spec = 'Spec',
  Ticket = 'Ticket',
}

export interface Spec {
  id: string
  projectId: string
  title: string
  content: string
  kind: ArtifactKind.Spec
  createdAt: string
  updatedAt: string
}

export interface Ticket {
  id: string
  projectId: string
  specId?: string
  title: string
  description: string
  status: TicketStatus
  kind: ArtifactKind.Ticket
  assigneeId?: string
  assigneeName?: string
  createdAt: string
  updatedAt: string
}
