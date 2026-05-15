import { appendFile, mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import { OrchestrationEventSchema } from '@traycer/shared'
import type { OrchestrationEvent } from '@traycer/shared'

export interface ExecutionStore {
  append(event: OrchestrationEvent): Promise<void>
  list(workflowId: string): Promise<OrchestrationEvent[]>
}

export class FileExecutionStore implements ExecutionStore {
  constructor(
    private readonly storeDirectory = path.resolve(
      process.env.TRAYCER_EXECUTION_STORE_DIR ?? '.traycer/executions',
    ),
  ) {}

  async append(event: OrchestrationEvent): Promise<void> {
    const parsedEvent = OrchestrationEventSchema.parse(event)

    await mkdir(this.storeDirectory, { recursive: true })
    await appendFile(
      this.workflowPath(parsedEvent.workflowId),
      `${JSON.stringify(parsedEvent)}\n`,
    )
  }

  async list(workflowId: string): Promise<OrchestrationEvent[]> {
    const content = await readFile(this.workflowPath(workflowId), 'utf8').catch(
      (error) => {
        if (
          error instanceof Error &&
          'code' in error &&
          error.code === 'ENOENT'
        ) {
          return ''
        }

        throw error
      },
    )

    return content
      .split('\n')
      .filter(Boolean)
      .map((line) => OrchestrationEventSchema.parse(JSON.parse(line)))
  }

  private workflowPath(workflowId: string): string {
    return path.join(this.storeDirectory, `${safeFileName(workflowId)}.jsonl`)
  }
}

export class InMemoryExecutionStore implements ExecutionStore {
  private readonly events = new Map<string, OrchestrationEvent[]>()

  async append(event: OrchestrationEvent): Promise<void> {
    const parsedEvent = OrchestrationEventSchema.parse(event)
    const events = this.events.get(parsedEvent.workflowId) ?? []

    events.push(parsedEvent)
    this.events.set(parsedEvent.workflowId, events)
  }

  async list(workflowId: string): Promise<OrchestrationEvent[]> {
    return [...(this.events.get(workflowId) ?? [])]
  }
}

export function createFileExecutionStore(
  storeDirectory?: string,
): FileExecutionStore {
  return new FileExecutionStore(storeDirectory)
}

function safeFileName(input: string): string {
  return input.replace(/[^A-Za-z0-9_.-]/gu, '_')
}
