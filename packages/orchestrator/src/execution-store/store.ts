import { OrchestrationEvent } from '@traycer/shared'

export interface ExecutionStore {
  append(event: OrchestrationEvent): Promise<void>
  list(workflowId: string): Promise<OrchestrationEvent[]>
}
