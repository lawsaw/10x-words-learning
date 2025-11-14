"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { WordViewMode } from "@/lib/types"

const VIEW_OPTIONS: Array<{ label: string; value: WordViewMode }> = [
  { label: "Table", value: "table" },
  { label: "Slider", value: "slider" },
]

type ModeToggleProps = {
  value: WordViewMode
  onChange: (mode: WordViewMode) => void
  className?: string
}

export function ModeToggle({ value, onChange, className }: ModeToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 p-1 text-xs",
        className,
      )}
      role="group"
      aria-label="Study mode selection"
    >
      {VIEW_OPTIONS.map((option) => {
        const isActive = option.value === value
        return (
          <Button
            key={option.value}
            type="button"
            variant={isActive ? "default" : "ghost"}
            size="sm"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "px-3 py-1 text-xs",
              isActive ? "shadow-sm" : "text-muted-foreground",
            )}
          >
            {option.label}
          </Button>
        )
      })}
    </div>
  )
}


