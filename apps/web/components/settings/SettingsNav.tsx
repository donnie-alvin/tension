'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Monitor, Settings, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  {
    href: '/settings',
    label: 'General',
    icon: Settings,
  },
  {
    href: '/settings/profile',
    label: 'Profile',
    icon: User,
  },
  {
    href: '/settings/appearance',
    label: 'Appearance',
    icon: Monitor,
  },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="w-full shrink-0 space-y-1 sm:w-48">
      {links.map((link) => {
        const Icon = link.icon
        const active =
          link.href === '/settings'
            ? pathname === link.href
            : pathname.startsWith(link.href)

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              active && 'bg-muted text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
