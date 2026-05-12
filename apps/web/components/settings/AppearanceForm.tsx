'use client'

import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const themes = [
  {
    value: 'light',
    label: 'Light',
    previewClass: 'bg-white',
    barClass: 'bg-zinc-200',
    panelClass: 'bg-zinc-100',
  },
  {
    value: 'dark',
    label: 'Dark',
    previewClass: 'bg-zinc-950',
    barClass: 'bg-zinc-800',
    panelClass: 'bg-zinc-900',
  },
  {
    value: 'system',
    label: 'System',
    previewClass: 'bg-gradient-to-br from-white to-zinc-950',
    barClass: 'bg-zinc-400',
    panelClass: 'bg-zinc-200',
  },
]

export function AppearanceForm() {
  const { theme = 'system', setTheme } = useTheme()

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row">
      {themes.map((item) => {
        const selected = theme === item.value

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => setTheme(item.value)}
            className={cn(
              'flex flex-1 flex-col items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/60',
              selected && 'ring-2 ring-primary',
            )}
          >
            <div
              className={cn(
                'h-24 w-full overflow-hidden rounded-md border',
                item.previewClass,
              )}
            >
              <div className={cn('h-5 w-full', item.barClass)} />
              <div className="grid grid-cols-3 gap-2 p-2">
                <div className={cn('col-span-1 h-14 rounded', item.panelClass)} />
                <div className={cn('col-span-2 h-14 rounded', item.panelClass)} />
              </div>
            </div>
            <span className="font-medium">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
