"use client"

import { cn } from "@/lib/utils"

type SliderCardProps = {
  term: string
  translation: string
  examples?: string
  revealed: boolean
  onReveal: () => void
  onHide: () => void
  busy?: boolean
  showTermFirst?: boolean
}

export function SliderCard({
  term,
  translation,
  examples,
  revealed,
  onReveal,
  onHide,
  busy,
  showTermFirst,
}: SliderCardProps) {
  const showTerm = Boolean(showTermFirst)
  const primaryLabel = showTerm ? "Term" : "Translation"
  const primaryValue = showTerm ? term : translation
  const secondaryLabel = showTerm ? "Translation" : "Term"
  const secondaryValue = showTerm ? translation : term

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-10 text-center shadow-md">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{primaryLabel}</p>
        <h2 className="text-3xl font-semibold text-foreground">{primaryValue}</h2>
      </div>

      <div className="flex w-full items-center justify-center">
        {revealed ? (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{secondaryLabel}</p>
            <p className="text-xl font-medium text-foreground">{secondaryValue}</p>
          </div>
        ) : (
          <button
            type="button"
            className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer disabled:cursor-not-allowed"
            onClick={onReveal}
            disabled={busy}
          >
            Reveal {secondaryLabel.toLowerCase()}
          </button>
        )}
      </div>

      {revealed && examples ? (
        <div className={cn("w-full rounded-md border border-dashed border-border bg-muted/40 p-4 text-left")}>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Examples</p>
          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{examples}</p>
        </div>
      ) : null}

      {revealed ? (
        <button
          type="button"
          className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer disabled:cursor-not-allowed"
          onClick={onHide}
          disabled={busy}
        >
          Hide {secondaryLabel.toLowerCase()}
        </button>
      ) : null}
    </div>
  )
}

