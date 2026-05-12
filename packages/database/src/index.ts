export const persistenceRequirements = [
  'execution-logs',
  'orchestration-state',
  'append-only-events',
  'replayability',
  'resumability',
  'deterministic-recovery',
] as const
