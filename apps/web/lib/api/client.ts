import {
  Execution,
  Project,
  ProjectStatus,
  Spec,
  Ticket,
  TicketStatus,
} from '@traycer/shared'
import projectsFixture from './mocks/projects.json'
import artifactsFixture from './mocks/artifacts.json'
import executionsFixture from './mocks/executions.json'

export class ApiError extends Error {
  status: number
  code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface ArtifactFixture {
  specs: Spec[]
  tickets: Ticket[]
}

const projects = projectsFixture as Project[]
const artifacts = artifactsFixture as ArtifactFixture
const executions = executionsFixture as Execution[]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function parseBody(options?: RequestInit): Record<string, unknown> {
  if (typeof options?.body !== 'string') {
    return {}
  }

  try {
    const parsed: unknown = JSON.parse(options.body)
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function stringFromBody(
  body: Record<string, unknown>,
  key: string,
  fallback = '',
): string {
  const value = body[key]
  return typeof value === 'string' ? value : fallback
}

function isProjectStatus(value: unknown): value is ProjectStatus {
  return Object.values(ProjectStatus).includes(value as ProjectStatus)
}

function isTicketStatus(value: unknown): value is TicketStatus {
  return Object.values(TicketStatus).includes(value as TicketStatus)
}

function normalizePath(path: string): string {
  const url = new URL(path, 'https://mock.traycer.local')
  return url.pathname.replace(/^\/api(?=\/)/, '') || '/'
}

function resolveProject(pathname: string): Project {
  const id = pathname.split('/')[2]
  const project = projects.find((item) => item.id === id)

  if (!project) {
    throw new ApiError('Project not found', 404, 'PROJECT_NOT_FOUND')
  }

  return project
}

function resolveSpec(pathname: string): Spec {
  const id = pathname.split('/')[2]
  const spec = artifacts.specs.find((item) => item.id === id)

  if (!spec) {
    throw new ApiError('Spec not found', 404, 'SPEC_NOT_FOUND')
  }

  return spec
}

function resolveTicket(pathname: string): Ticket {
  const id = pathname.split('/')[2]
  const ticket = artifacts.tickets.find((item) => item.id === id)

  if (!ticket) {
    throw new ApiError('Ticket not found', 404, 'TICKET_NOT_FOUND')
  }

  return ticket
}

function resolveExecution(pathname: string): Execution {
  const id = pathname.split('/')[2]
  const execution = executions.find((item) => item.id === id)

  if (!execution) {
    throw new ApiError('Execution not found', 404, 'EXECUTION_NOT_FOUND')
  }

  return execution
}

async function resolveMock<T>(path: string, options?: RequestInit): Promise<T> {
  const pathname = normalizePath(path)
  const method = options?.method?.toUpperCase() ?? 'GET'
  const body = parseBody(options)
  const now = new Date().toISOString()

  if (pathname === '/projects' && method === 'GET') {
    return clone(projects) as T
  }

  if (pathname === '/projects' && method === 'POST') {
    const project: Project = {
      id: `project-${Date.now()}`,
      name: stringFromBody(body, 'name', 'Untitled project'),
      description: stringFromBody(body, 'description'),
      status: isProjectStatus(body.status) ? body.status : ProjectStatus.Draft,
      createdAt: now,
      updatedAt: now,
      artifactCount: 0,
    }

    projects.unshift(project)
    return clone(project) as T
  }

  if (/^\/projects\/[^/]+$/.test(pathname) && method === 'GET') {
    return clone(resolveProject(pathname)) as T
  }

  if (/^\/projects\/[^/]+$/.test(pathname) && method === 'PATCH') {
    const project = resolveProject(pathname)
    const updated: Project = {
      ...project,
      name: stringFromBody(body, 'name', project.name),
      description: stringFromBody(body, 'description', project.description),
      status: isProjectStatus(body.status) ? body.status : project.status,
      updatedAt: now,
    }
    projects.splice(projects.indexOf(project), 1, updated)
    return clone(updated) as T
  }

  if (/^\/projects\/[^/]+$/.test(pathname) && method === 'DELETE') {
    const project = resolveProject(pathname)
    projects.splice(projects.indexOf(project), 1)
    return undefined as T
  }

  const projectSpecsMatch = pathname.match(/^\/projects\/([^/]+)\/specs$/)
  if (projectSpecsMatch && method === 'GET') {
    const projectId = projectSpecsMatch[1]
    return clone(artifacts.specs.filter((spec) => spec.projectId === projectId)) as T
  }

  const projectTicketsMatch = pathname.match(/^\/projects\/([^/]+)\/tickets$/)
  if (projectTicketsMatch && method === 'GET') {
    const projectId = projectTicketsMatch[1]
    return clone(
      artifacts.tickets.filter((ticket) => ticket.projectId === projectId),
    ) as T
  }

  if (/^\/specs\/[^/]+$/.test(pathname) && method === 'GET') {
    return clone(resolveSpec(pathname)) as T
  }

  if (/^\/tickets\/[^/]+$/.test(pathname) && method === 'GET') {
    return clone(resolveTicket(pathname)) as T
  }

  if (/^\/tickets\/[^/]+\/status$/.test(pathname) && method === 'PATCH') {
    const id = pathname.split('/')[2]
    const ticket = artifacts.tickets.find((item) => item.id === id)

    if (!ticket) {
      throw new ApiError('Ticket not found', 404, 'TICKET_NOT_FOUND')
    }

    const updated: Ticket = {
      ...ticket,
      status: isTicketStatus(body.status) ? body.status : ticket.status,
      updatedAt: now,
    }
    artifacts.tickets.splice(artifacts.tickets.indexOf(ticket), 1, updated)
    return clone(updated) as T
  }

  const projectExecutionsMatch = pathname.match(
    /^\/projects\/([^/]+)\/executions$/,
  )
  if (projectExecutionsMatch && method === 'GET') {
    const projectId = projectExecutionsMatch[1]
    return clone(
      executions.filter((execution) => execution.projectId === projectId),
    ) as T
  }

  if (/^\/executions\/[^/]+$/.test(pathname) && method === 'GET') {
    return clone(resolveExecution(pathname)) as T
  }

  throw new ApiError(`No mock route for ${method} ${pathname}`, 404, 'MOCK_NOT_FOUND')
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
    return resolveMock<T>(path, options)
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '/api'
  const headers = new Headers(options.headers)

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('traycer_token')
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    const message =
      isRecord(payload) && typeof payload.message === 'string'
        ? payload.message
        : 'API request failed'
    const code =
      isRecord(payload) && typeof payload.code === 'string'
        ? payload.code
        : 'API_ERROR'

    throw new ApiError(message, response.status, code)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
