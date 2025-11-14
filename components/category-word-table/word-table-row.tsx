"use client"

import { Fragment } from "react"
import { BookOpen } from "lucide-react"

import { ExamplesAccordion } from "@/components/category-word-table/examples-accordion"
import { Button } from "@/components/ui/button"
import { WordActionsMenu } from "@/components/category-word-table/word-actions-menu"
import type { DeleteWordContext, WordTableRowVm } from "@/lib/types"

type WordTableRowProps = {
  row: WordTableRowVm
  onEdit: (id: string) => void
  onDelete: (context: DeleteWordContext) => void
  busy?: boolean
  expanded?: boolean
  onToggle?: () => void
}

export function WordTableRow({ row, onEdit, onDelete, busy, expanded, onToggle }: WordTableRowProps) {
  const hasExamples = Boolean(row.examplesMd && row.examplesMd.trim().length > 0)

  return (
    <Fragment>
      <tr className="align-middle">
        <td className="whitespace-pre-wrap px-4 py-3 align-middle font-medium text-foreground">
          {row.term}
        </td>
        <td className="whitespace-pre-wrap px-4 py-3 align-middle text-muted-foreground">
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
              <span className="sr-only">
                {expanded ? "Hide examples" : "Show examples"}
              </span>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">No examples</span>
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
         <tr className="bg-muted/20">
           <td colSpan={4} className="px-4 pb-4 pt-0">
             <div className="space-y-2 pt-4 text-left text-sm text-muted-foreground">
               {hasExamples ? (
                 <ul className="space-y-1">
                   {row.examplesMd
                     .split("\n")
                     .filter((line) => Boolean(line.trim()))
                     .slice(0, 5)
                     .map((line, index) => (
                       <li key={index} className="whitespace-pre-wrap">
                         {line}
                       </li>
                     ))}
                 </ul>
               ) : (
                 <p>No examples provided yet.</p>
               )}
             </div>
           </td>
         </tr>
       ) : null}
    </Fragment>
  )
}
