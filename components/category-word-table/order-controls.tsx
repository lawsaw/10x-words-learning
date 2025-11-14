"use client"

import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { SortDirection, WordOrderField } from "@/lib/types"

const ORDER_OPTIONS: Array<{ label: string; value: Extract<WordOrderField, "createdAt" | "term"> }> = [
  { label: "Created", value: "createdAt" },
  { label: "Term", value: "term" },
]

type OrderControlsProps = {
  orderBy: WordOrderField
  direction: SortDirection
  onOrderChange: (value: WordOrderField) => void
  onDirectionToggle: () => void
  disabled?: boolean
}

export function OrderControls({
  orderBy,
  direction,
  onOrderChange,
  onDirectionToggle,
  disabled,
}: OrderControlsProps) {
  const DirectionIcon = direction === "asc" ? ArrowUpNarrowWide : ArrowDownWideNarrow

  return (
    <div className="flex items-center gap-2 text-xs">
      <label className="flex items-center gap-1">
        <span className="text-muted-foreground">Order by</span>
        <select
          className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={orderBy}
          onChange={(event) => onOrderChange(event.target.value as WordOrderField)}
          disabled={disabled}
        >
          {ORDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onDirectionToggle}
        disabled={disabled}
        aria-label={`Sort direction ${direction === "asc" ? "ascending" : "descending"}`}
      >
        <DirectionIcon className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  )
}
