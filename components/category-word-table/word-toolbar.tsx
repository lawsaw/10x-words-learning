'use client'

import { useMemo } from 'react'

import { CreateWordButton } from '@/components/category-word-table/create-word-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SortDirection, WordOrderField } from '@/lib/types'

type WordToolbarProps = {
  onCreate: () => void
  orderBy: WordOrderField
  direction: SortDirection
  onSortChange: (orderBy: WordOrderField, direction: SortDirection) => void
  wordCount: number
  busy?: boolean
}

const SORT_OPTIONS: Array<{
  label: string
  orderBy: WordOrderField
  direction: SortDirection
}> = [
  { label: 'Newest first', orderBy: 'createdAt', direction: 'desc' },
  { label: 'Oldest first', orderBy: 'createdAt', direction: 'asc' },
  { label: 'Term A → Z', orderBy: 'term', direction: 'asc' },
  { label: 'Term Z → A', orderBy: 'term', direction: 'desc' },
]

export function WordToolbar({
  onCreate,
  orderBy,
  direction,
  onSortChange,
  wordCount,
  busy,
}: WordToolbarProps) {
  const summary = useMemo(() => {
    if (wordCount === 0) {
      return 'No words stored yet'
    }

    if (wordCount === 1) {
      return '1 word stored'
    }

    return `${wordCount} words stored`
  }, [wordCount])

  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-lg border px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1 text-sm">
        <p className="text-muted-foreground">{summary}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <CreateWordButton onClick={onCreate} disabled={busy} />
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span id="word-toolbar-sort-label">Sort</span>
          <Select
            value={`${orderBy}:${direction}`}
            onValueChange={value => {
              const [nextOrderBy, nextDirection] = value.split(':') as [
                WordOrderField,
                SortDirection,
              ]
              onSortChange(nextOrderBy, nextDirection)
            }}
            disabled={busy}
          >
            <SelectTrigger
              aria-labelledby="word-toolbar-sort-label"
              className="h-8 w-[11.5rem] justify-between px-2 text-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem
                  key={`${option.orderBy}:${option.direction}`}
                  value={`${option.orderBy}:${option.direction}`}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
