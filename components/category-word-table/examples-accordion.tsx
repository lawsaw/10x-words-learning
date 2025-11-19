'use client'

import { useId } from 'react'

import { sanitizeMarkdown } from '@/lib/sanitize'

type ExamplesAccordionProps = {
  markdown: string
}

export function ExamplesAccordion({ markdown }: ExamplesAccordionProps) {
  const contentId = useId()
  const sanitized = sanitizeMarkdown(markdown)

  if (!sanitized.trim()) {
    return <span className="text-muted-foreground">No examples</span>
  }

  return (
    <details className="group" aria-labelledby={contentId}>
      <summary className="text-primary hover:text-primary/80 flex cursor-pointer items-center gap-1 text-sm font-medium transition outline-none">
        <span>Examples</span>
        <span
          aria-hidden
          className="text-muted-foreground text-xs transition group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <div id={contentId} className="bg-muted/60 text-muted-foreground mt-2 rounded-md p-3 text-sm">
        <pre className="text-foreground text-left text-xs break-words whitespace-pre-wrap">
          {sanitized}
        </pre>
      </div>
    </details>
  )
}
