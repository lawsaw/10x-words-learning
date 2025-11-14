"use client"

type AiLoaderOverlayProps = {
  visible: boolean
  message?: string
}

export function AiLoaderOverlay({ visible, message }: AiLoaderOverlayProps) {
  if (!visible) {
    return null
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 rounded-md bg-background/80 text-sm text-muted-foreground">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-transparent" />
      <span>{message ?? "Generating suggestions…"}</span>
    </div>
  )
}


