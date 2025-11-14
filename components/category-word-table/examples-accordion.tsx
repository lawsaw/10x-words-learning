"use client"

import { useId } from "react"

import { sanitizeMarkdown } from "@/lib/sanitize"

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
      <summary className="flex cursor-pointer items-center gap-1 text-sm font-medium text-primary outline-none transition hover:text-primary/80">
        <span>Examples</span>
        <span
          aria-hidden
          className="text-xs text-muted-foreground transition group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <div
        id={contentId}
        className="mt-2 rounded-md bg-muted/60 p-3 text-sm text-muted-foreground"
      >
        <pre className="whitespace-pre-wrap break-words text-left text-xs text-foreground">
          {sanitized}
        </pre>
      </div>
    </details>
  )
}
