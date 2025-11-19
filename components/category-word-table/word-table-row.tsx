'use client'

import { Fragment } from 'react'
import { BookOpen } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { WordActionsMenu } from '@/components/category-word-table/word-actions-menu'
import type { DeleteWordContext, WordTableRowVm } from '@/lib/types'

type WordTableRowProps = {
  row: WordTableRowVm
  onEdit: (id: string) => void
  onDelete: (context: DeleteWordContext) => void
  busy?: boolean
  expanded?: boolean
  onToggle?: () => void
}

export function WordTableRow({
  row,
  onEdit,
  onDelete,
  busy,
  expanded,
  onToggle,
}: WordTableRowProps) {
  const hasExamples = Boolean(row.examplesMd && row.examplesMd.trim().length > 0)

  return (
    <Fragment>
      {/* Desktop table row - hidden on mobile */}
      <tr className="hidden md:table-row align-middle">
        <td className="text-foreground px-4 py-3 align-middle font-medium break-words max-w-[200px]">
          {row.term}
        </td>
        <td className="text-muted-foreground px-4 py-3 align-middle break-words max-w-[250px]">
          {row.translation}
        </td>
        <td className="px-4 py-3 text-center align-middle">
          {hasExamples ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-8 w-8 cursor-pointer"
              onClick={onToggle}
              disabled={busy}
            >
              <BookOpen className="h-4 w-4" aria-hidden />
              <span className="sr-only">{expanded ? 'Hide examples' : 'Show examples'}</span>
            </Button>
          ) : (
            <span className="text-muted-foreground text-xs">No examples</span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex justify-end">
            <WordActionsMenu
              onEdit={() => onEdit(row.id)}
              onDelete={() =>
                onDelete({
                  wordId: row.id,
                  term: row.term,
                })
              }
              busy={busy}
            />
          </div>
        </td>
      </tr>
      {expanded && hasExamples ? (
        <tr className="hidden md:table-row bg-muted/20">
          <td colSpan={4} className="px-4 pt-0 pb-4">
            <div className="text-muted-foreground space-y-2 pt-4 text-left text-sm">
              <ul className="space-y-1">
                {row.examplesMd
                  .split('\n')
                  .filter(line => Boolean(line.trim()))
                  .slice(0, 5)
                  .map((line, index) => (
                    <li key={index} className="break-words">
                      {line}
                    </li>
                  ))}
              </ul>
            </div>
          </td>
        </tr>
      ) : null}

      {/* Mobile card view - visible only on mobile */}
      <div className="md:hidden p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <div className="text-muted-foreground/60 text-[10px] uppercase tracking-wider font-medium mb-0.5">
                Term
              </div>
              <div className="text-foreground font-medium break-words">
                {row.term}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground/60 text-[10px] uppercase tracking-wider font-medium mb-0.5">
                Translation
              </div>
              <div className="text-muted-foreground break-words">
                {row.translation}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <WordActionsMenu
              onEdit={() => onEdit(row.id)}
              onDelete={() =>
                onDelete({
                  wordId: row.id,
                  term: row.term,
                })
              }
              busy={busy}
            />
          </div>
        </div>

        {/* Examples section for mobile */}
        {hasExamples && (
          <div className="pt-2 border-t border-border/50">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full justify-center gap-2"
              onClick={onToggle}
              disabled={busy}
            >
              <BookOpen className="h-4 w-4" aria-hidden />
              <span>{expanded ? 'Hide examples' : 'Show examples'}</span>
            </Button>
            {expanded && (
              <div className="text-muted-foreground mt-3 space-y-2 text-sm">
                <ul className="space-y-1">
                  {row.examplesMd
                    .split('\n')
                    .filter(line => Boolean(line.trim()))
                    .slice(0, 5)
                    .map((line, index) => (
                      <li key={index} className="break-words">
                        {line}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Fragment>
  )
}
