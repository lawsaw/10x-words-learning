"use client"

import { useMemo } from "react"

import { CreateWordButton } from "@/components/category-word-table/create-word-button"
import type { SortDirection, WordOrderField } from "@/lib/types"

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
  { label: "Newest first", orderBy: "createdAt", direction: "desc" },
  { label: "Oldest first", orderBy: "createdAt", direction: "asc" },
  { label: "Term A → Z", orderBy: "term", direction: "asc" },
  { label: "Term Z → A", orderBy: "term", direction: "desc" },
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
      return "No words stored yet"
    }

    if (wordCount === 1) {
      return "1 word stored"
    }

    return `${wordCount} words stored`
  }, [wordCount])

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1 text-sm">
        <p className="font-medium text-foreground">Category words</p>
        <p className="text-muted-foreground">{summary}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <CreateWordButton onClick={onCreate} disabled={busy} />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Sort</span>
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            value={`${orderBy}:${direction}`}
            onChange={(event) => {
              const [nextOrderBy, nextDirection] = event.target.value.split(":") as [
                WordOrderField,
                SortDirection,
              ]
              onSortChange(nextOrderBy, nextDirection)
            }}
            disabled={busy}
          >
            {SORT_OPTIONS.map((option) => (
              <option
                key={`${option.orderBy}:${option.direction}`}
                value={`${option.orderBy}:${option.direction}`}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}


