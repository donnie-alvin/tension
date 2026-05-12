import { trace } from '@opentelemetry/api'

export const tracer = trace.getTracer('traycer-platform')

export const telemetrySignals = [
  'workflow.tracing',
  'ai.call.tracing',
  'queue.metrics',
] as const
