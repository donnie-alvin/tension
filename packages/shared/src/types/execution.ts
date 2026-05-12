export enum ExecutionPhase {
  Planning = 'Planning',
  Implementation = 'Implementation',
  Verification = 'Verification',
  Complete = 'Complete',
}

export enum ExecutionState {
  Queued = 'Queued',
  Running = 'Running',
  Succeeded = 'Succeeded',
  Failed = 'Failed',
  Cancelled = 'Cancelled',
}

export interface Execution {
  id: string
  projectId: string
  title: string
  phase: ExecutionPhase
  state: ExecutionState
  summary: string
  startedAt: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}
