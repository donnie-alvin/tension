import { Project, ProjectStatus, Ticket, TicketStatus } from '@traycer/shared'
import { ApiError } from '../transport/errors'
import {
  getArtifactFixtures,
  getExecutionFixtures,
  getProjectFixtures,
} from './fixtures'
import { clone, parseBody, stringFromBody } from './utils'

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

export async function resolveMock<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const pathname = normalizePath(path)
  const method = options?.method?.toUpperCase() ?? 'GET'
  const body = parseBody(options)
  const projects = getProjectFixtures()
  const artifacts = getArtifactFixtures()
  const executions = getExecutionFixtures()
  const now = new Date().toISOString()

  if (pathname === '/projects' && method === 'GET') {
    return clone(projects) as T
  }

  if (pathname === '/projects' && method === 'POST') {
    const project: Project = {
      id: `preview-project-${crypto.randomUUID()}`,
      name: stringFromBody(body, 'name', 'Untitled project'),
      description: stringFromBody(body, 'description'),
      status: isProjectStatus(body.status) ? body.status : ProjectStatus.Draft,
      createdAt: now,
      updatedAt: now,
      artifactCount: 0,
    }

    return clone(project) as T
  }

  const projectMatch = pathname.match(/^\/projects\/([^/]+)$/)
  if (projectMatch && method === 'GET') {
    const project = projects.find((item) => item.id === projectMatch[1])

    if (!project) {
      throw new ApiError('Project not found', 404, 'PROJECT_NOT_FOUND')
    }

    return clone(project) as T
  }

  if (projectMatch && method === 'PATCH') {
    const project = projects.find((item) => item.id === projectMatch[1])

    if (!project) {
      throw new ApiError('Project not found', 404, 'PROJECT_NOT_FOUND')
    }

    return clone({
      ...project,
      name: stringFromBody(body, 'name', project.name),
      description: stringFromBody(body, 'description', project.description),
      status: isProjectStatus(body.status) ? body.status : project.status,
      updatedAt: now,
    }) as T
  }

  if (projectMatch && method === 'DELETE') {
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

  const specMatch = pathname.match(/^\/specs\/([^/]+)$/)
  if (specMatch && method === 'GET') {
    const spec = artifacts.specs.find((item) => item.id === specMatch[1])

    if (!spec) {
      throw new ApiError('Spec not found', 404, 'SPEC_NOT_FOUND')
    }

    return clone(spec) as T
  }

  const ticketMatch = pathname.match(/^\/tickets\/([^/]+)$/)
  if (ticketMatch && method === 'GET') {
    const ticket = artifacts.tickets.find((item) => item.id === ticketMatch[1])

    if (!ticket) {
      throw new ApiError('Ticket not found', 404, 'TICKET_NOT_FOUND')
    }

    return clone(ticket) as T
  }

  const ticketStatusMatch = pathname.match(/^\/tickets\/([^/]+)\/status$/)
  if (ticketStatusMatch && method === 'PATCH') {
    const ticket = artifacts.tickets.find(
      (item) => item.id === ticketStatusMatch[1],
    )

    if (!ticket) {
      throw new ApiError('Ticket not found', 404, 'TICKET_NOT_FOUND')
    }

    const updated: Ticket = {
      ...ticket,
      status: isTicketStatus(body.status) ? body.status : ticket.status,
      updatedAt: now,
    }

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

  const executionMatch = pathname.match(/^\/executions\/([^/]+)$/)
  if (executionMatch && method === 'GET') {
    const execution = executions.find((item) => item.id === executionMatch[1])

    if (!execution) {
      throw new ApiError('Execution not found', 404, 'EXECUTION_NOT_FOUND')
    }

    return clone(execution) as T
  }

  throw new ApiError(`No mock route for ${method} ${pathname}`, 404, 'MOCK_NOT_FOUND')
}
