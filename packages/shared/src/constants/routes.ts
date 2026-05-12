export const routes = {
  home: () => '/',
  login: () => '/login',
  register: () => '/register',
  projects: () => '/projects',
  project: (projectId: string) => `/projects/${projectId}`,
  artifacts: (projectId: string) => `/projects/${projectId}/artifacts`,
  spec: (projectId: string, specId: string) =>
    `/projects/${projectId}/artifacts/specs/${specId}`,
  ticket: (projectId: string, ticketId: string) =>
    `/projects/${projectId}/artifacts/tickets/${ticketId}`,
  executions: (projectId: string) => `/projects/${projectId}/executions`,
  execution: (projectId: string, executionId: string) =>
    `/projects/${projectId}/executions/${executionId}`,
  settings: () => '/settings',
  settingsProfile: () => '/settings/profile',
  settingsAppearance: () => '/settings/appearance',
} as const
