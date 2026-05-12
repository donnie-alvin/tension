const cancelledWorkflows = new Set<string>()

export function requestCancellation(workflowId: string): void {
  cancelledWorkflows.add(workflowId)
}

export function isCancellationRequested(workflowId: string): boolean {
  return cancelledWorkflows.has(workflowId)
}
