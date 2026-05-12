import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: null,
})

export function withCorrelationId(correlationId: string) {
  return logger.child({ correlationId })
}
