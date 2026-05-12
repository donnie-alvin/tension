export type WorkflowState =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'

export const terminalWorkflowStates: WorkflowState[] = [
  'succeeded',
  'failed',
  'cancelled',
]
