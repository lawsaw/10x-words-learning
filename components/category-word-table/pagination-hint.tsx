"use client"

import type { WordListMetaDto } from "@/lib/types"

type PaginationHintProps = {
  meta: WordListMetaDto
}

export function PaginationHint({ meta }: PaginationHintProps) {
  if (!meta.hasMore) {
    return (
      <p className="text-xs text-muted-foreground">
        Showing all loaded words. Additional entries will appear here when available.
      </p>
    )
  }

  return (
    <div className="rounded-md border border-dashed border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
      There are more words beyond the current page. Pagination controls will be added in a future iteration.
    </div>
  )
}


