"use client"

import { memo, useState } from "react"

import { WordTableRow } from "@/components/category-word-table/word-table-row"
import type {
  DeleteWordContext,
  WordTableRowVm,
} from "@/lib/types"

type WordTableProps = {
  rows: WordTableRowVm[]
  onEdit: (wordId: string) => void
  onDelete: (context: DeleteWordContext) => void
  busy?: boolean
}

export const WordTable = memo(function WordTable({ rows, onEdit, onDelete, busy }: WordTableProps) {
  if (!rows || rows.length === 0) {
    return null
  }

  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({})

  const toggleRow = (id: string) => {
    setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="overflow-visible rounded-lg border border-border bg-card shadow-sm">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-muted/70 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <tr>
            <HeaderCell className="text-left align-middle">Term</HeaderCell>
            <HeaderCell className="text-left align-middle">Translation</HeaderCell>
            <HeaderCell className="text-center align-middle">Examples</HeaderCell>
            <HeaderCell className="text-right align-middle">Actions</HeaderCell>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {rows.map((row) => (
            <WordTableRow
              key={row.id}
              row={row}
              onEdit={onEdit}
              onDelete={onDelete}
              busy={busy}
              expanded={Boolean(expandedMap[row.id])}
              onToggle={() => toggleRow(row.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
})

type HeaderCellProps = {
  children: React.ReactNode
  className?: string
}

function HeaderCell({ children, className }: HeaderCellProps) {
  return <th className={`px-4 py-3 text-left ${className ?? ""}`}>{children}</th>
}


