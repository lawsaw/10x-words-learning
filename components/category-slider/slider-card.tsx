'use client'

import { cn } from '@/lib/utils'

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
  const primaryLabel = showTerm ? 'Term' : 'Translation'
  const primaryValue = showTerm ? term : translation
  const secondaryLabel = showTerm ? 'Translation' : 'Term'
  const secondaryValue = showTerm ? translation : term

  return (
    <div className="border-border bg-card flex w-full max-w-xl flex-col items-center gap-4 rounded-xl border px-6 py-10 text-center shadow-md">
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">{primaryLabel}</p>
        <h2 className="text-foreground text-3xl font-semibold">{primaryValue}</h2>
      </div>

      <div className="flex w-full items-center justify-center">
        {revealed ? (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              {secondaryLabel}
            </p>
            <p className="text-foreground text-xl font-medium">{secondaryValue}</p>
          </div>
        ) : (
          <button
            type="button"
            className="border-border text-muted-foreground hover:text-foreground cursor-pointer rounded-md border px-4 py-2 text-sm disabled:cursor-not-allowed"
            onClick={onReveal}
            disabled={busy}
          >
            Reveal {secondaryLabel.toLowerCase()}
          </button>
        )}
      </div>

      {revealed && examples ? (
        <div
          className={cn(
            'border-border bg-muted/40 w-full rounded-md border border-dashed p-4 text-left'
          )}
        >
          <p className="text-muted-foreground text-xs tracking-wide uppercase">Examples</p>
          <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">{examples}</p>
        </div>
      ) : null}

      {revealed ? (
        <button
          type="button"
          className="border-border text-muted-foreground hover:text-foreground cursor-pointer rounded-md border px-3 py-1 text-xs disabled:cursor-not-allowed"
          onClick={onHide}
          disabled={busy}
        >
          Hide {secondaryLabel.toLowerCase()}
        </button>
      ) : null}
    </div>
  )
}
