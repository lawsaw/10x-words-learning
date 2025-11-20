'use client'

import { memo, useState } from 'react'

import { WordTableRow } from '@/components/category-word-table/word-table-row'
import type { DeleteWordContext, WordTableRowVm } from '@/lib/types'

type WordTableProps = {
  rows: WordTableRowVm[]
  onEdit: (wordId: string) => void
  onDelete: (context: DeleteWordContext) => void
  busy?: boolean
}

export const WordTable = memo(function WordTable({ rows, onEdit, onDelete, busy }: WordTableProps) {
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({})

  if (!rows || rows.length === 0) {
    return null
  }

  const toggleRow = (id: string) => {
    setExpandedMap(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border shadow-sm">
      {/* Desktop table view - hidden on mobile */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-muted/70 text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            <tr>
              <HeaderCell className="text-left align-middle">Term</HeaderCell>
              <HeaderCell className="text-left align-middle">Translation</HeaderCell>
              <HeaderCell className="text-center align-middle">Examples</HeaderCell>
              <HeaderCell className="text-right align-middle">Actions</HeaderCell>
            </tr>
          </thead>
          <tbody className="divide-border/70 divide-y">
            {rows.map(row => (
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

      {/* Mobile card view - visible only on mobile */}
      <div className="md:hidden">
        <table className="w-full border-collapse">
          <tbody className="divide-border/70 divide-y">
            {rows.map(row => (
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
    </div>
  )
})

type HeaderCellProps = {
  children: React.ReactNode
  className?: string
}

function HeaderCell({ children, className }: HeaderCellProps) {
  return <th className={`px-4 py-3 text-left ${className ?? ''}`}>{children}</th>
}
