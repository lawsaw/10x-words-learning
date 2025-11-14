"use client"

import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
      <div className="flex items-center gap-1">
        <span id="order-controls-label" className="text-muted-foreground">
          Order by
        </span>
        <Select
          value={orderBy}
          onValueChange={(value) => onOrderChange(value as WordOrderField)}
          disabled={disabled}
        >
          <SelectTrigger
            aria-labelledby="order-controls-label"
            className="h-8 w-[7.5rem] justify-between px-2 text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
