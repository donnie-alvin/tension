'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  Settings,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/store/sidebar.store'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  isActive: (pathname: string) => boolean
}

const navItems: NavItem[] = [
  {
    label: 'Projects',
    href: '/projects',
    icon: FolderOpen,
    isActive: (pathname) =>
      pathname === '/projects' || /^\/projects\/[^/]+$/.test(pathname),
  },
  {
    label: 'Artifacts',
    href: '/projects',
    icon: FileText,
    isActive: (pathname) => pathname.includes('/artifacts'),
  },
  {
    label: 'Executions',
    href: '/executions',
    icon: Zap,
    isActive: (pathname) => pathname.includes('/executions'),
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    isActive: (pathname) => pathname.startsWith('/settings'),
  },
]

interface SidebarNavigationProps {
  isCollapsed: boolean
  onNavigate?: () => void
  showCollapseToggle?: boolean
}

export function SidebarNavigation({
  isCollapsed,
  onNavigate,
  showCollapseToggle = true,
}: SidebarNavigationProps) {
  const pathname = usePathname()
  const toggle = useSidebarStore((state) => state.toggle)

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center gap-3 border-b px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          {!isCollapsed && (
            <span className="text-sm font-semibold tracking-normal">Traycer</span>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = item.isActive(pathname)
            const link = (
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  active && 'bg-muted text-foreground',
                  isCollapsed && 'justify-center px-0',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="ml-3">{item.label}</span>}
              </Link>
            )

            if (!isCollapsed) {
              return <div key={item.label}>{link}</div>
            }

            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        {showCollapseToggle && (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-full"
              onClick={toggle}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

export function AppSidebar() {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed)

  return (
    <aside
      className={cn(
        'hidden h-screen shrink-0 border-r bg-background transition-all duration-200 md:flex',
        isCollapsed ? 'w-16' : 'w-56',
      )}
    >
      <SidebarNavigation isCollapsed={isCollapsed} />
    </aside>
  )
}
