export enum UserRole {
  Admin = 'Admin',
  Member = 'Member',
  Viewer = 'Viewer',
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}
