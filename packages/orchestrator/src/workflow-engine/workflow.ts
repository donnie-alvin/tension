import { OrchestrationStep } from '@traycer/shared'

export interface WorkflowDefinition {
  id: string
  version: string
  steps: OrchestrationStep[]
}

export function assertInspectableWorkflow(workflow: WorkflowDefinition): void {
  const stepIds = new Set(workflow.steps.map((step) => step.id))

  for (const step of workflow.steps) {
    for (const dependency of step.dependsOn) {
      if (!stepIds.has(dependency)) {
        throw new Error(`Unknown workflow dependency: ${dependency}`)
      }
    }
  }
}
