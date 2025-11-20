'use client'

import Link from 'next/link'

import { cn } from '@/lib/utils'
import type { WordViewMode } from '@/lib/types'

const VIEW_OPTIONS: Array<{ label: string; value: WordViewMode }> = [
  { label: 'Table', value: 'table' },
  { label: 'Slider', value: 'slider' },
]

type ModeToggleProps = {
  value: WordViewMode
  tableHref: string
  sliderHref: string
  className?: string
}

export function ModeToggle({ value, tableHref, sliderHref, className }: ModeToggleProps) {
  return (
    <div
      className={cn(
        'border-border bg-muted/40 inline-flex items-center gap-1 rounded-md border p-1 text-xs',
        className
      )}
      role="group"
      aria-label="Study mode selection"
    >
      {VIEW_OPTIONS.map(option => {
        const isActive = option.value === value
        const href = option.value === 'table' ? tableHref : sliderHref

        return (
          <Link
            key={option.value}
            href={href}
            prefetch={true}
            aria-pressed={isActive}
            className={cn(
              'ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
              isActive
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {option.label}
          </Link>
        )
      })}
    </div>
  )
}
