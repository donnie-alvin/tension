'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const currentTheme = theme ?? 'system'
  const nextTheme =
    currentTheme === 'light'
      ? 'dark'
      : currentTheme === 'dark'
        ? 'system'
        : 'light'

  const Icon =
    currentTheme === 'light' ? Sun : currentTheme === 'dark' ? Moon : Monitor

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch theme to ${nextTheme}`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}
