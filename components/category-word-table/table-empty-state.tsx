"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

type TableEmptyStateProps = {
  onCreate: () => void
}

export function TableEmptyState({ onCreate }: TableEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/40 px-6 py-12 text-center">
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-foreground">No words yet</h3>
        <p className="text-xs text-muted-foreground">
          Add your first word to this category to start practising vocabulary.
        </p>
      </div>
      <Button type="button" size="sm" onClick={onCreate}>
        <Plus className="mr-2 h-4 w-4" aria-hidden />
        Add first word
      </Button>
    </div>
  )
}


