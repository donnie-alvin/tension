export enum ProjectStatus {
  Active = 'Active',
  Draft = 'Draft',
  Archived = 'Archived',
}

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  artifactCount: number
}
