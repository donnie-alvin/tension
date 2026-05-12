import { Execution, Project, Spec, Ticket } from '@traycer/shared'
import projectsFixture from './fixtures/projects.json'
import artifactsFixture from './fixtures/artifacts.json'
import executionsFixture from './fixtures/executions.json'

export interface ArtifactFixture {
  specs: Spec[]
  tickets: Ticket[]
}

export function getProjectFixtures(): Project[] {
  return projectsFixture as Project[]
}

export function getArtifactFixtures(): ArtifactFixture {
  return artifactsFixture as ArtifactFixture
}

export function getExecutionFixtures(): Execution[] {
  return executionsFixture as Execution[]
}
