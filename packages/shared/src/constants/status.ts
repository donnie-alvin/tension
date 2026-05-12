import { ProjectStatus } from '../types/project'
import { TicketStatus } from '../types/artifact'

export const ticketStatusLabels: Record<TicketStatus, string> = {
  [TicketStatus.Todo]: 'Todo',
  [TicketStatus.InProgress]: 'In Progress',
  [TicketStatus.Done]: 'Done',
}

export const ticketStatusClasses: Record<TicketStatus, string> = {
  [TicketStatus.Todo]:
    'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
  [TicketStatus.InProgress]:
    'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
  [TicketStatus.Done]:
    'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
}

export const projectStatusLabels: Record<ProjectStatus, string> = {
  [ProjectStatus.Active]: 'Active',
  [ProjectStatus.Draft]: 'Draft',
  [ProjectStatus.Archived]: 'Archived',
}

export const projectStatusClasses: Record<ProjectStatus, string> = {
  [ProjectStatus.Active]:
    'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  [ProjectStatus.Draft]:
    'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
  [ProjectStatus.Archived]:
    'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
}
