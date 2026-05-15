import assert from 'node:assert/strict'

import {
  assertInspectableWorkflow,
  deterministicRetryPolicy,
  InMemoryExecutionStore,
  terminalWorkflowStates,
} from '../packages/orchestrator/src'

const workflow = {
  id: 'repo-indexing',
  version: '1.0.0',
  steps: [
    {
      id: 'accept-request',
      workflowId: 'repo-indexing',
      name: 'Accept indexing request',
      dependsOn: [],
      retryLimit: 0,
    },
    {
      id: 'index-repository',
      workflowId: 'repo-indexing',
      name: 'Index repository',
      dependsOn: ['accept-request'],
      retryLimit: deterministicRetryPolicy.maxAttempts,
    },
  ],
}

assertInspectableWorkflow(workflow)
assert.equal(deterministicRetryPolicy.maxAttempts, 3)
assert.equal(deterministicRetryPolicy.backoffMs, 1_000)
assert.deepEqual(terminalWorkflowStates, ['succeeded', 'failed', 'cancelled'])

const store = new InMemoryExecutionStore()

await store.append({
  id: 'event-1',
  workflowId: workflow.id,
  type: 'workflow.started',
  occurredAt: new Date('2026-05-15T00:00:00.000Z').toISOString(),
  payload: { version: workflow.version },
})

const events = await store.list(workflow.id)

assert.equal(events.length, 1)
assert.equal(events[0]?.type, 'workflow.started')
