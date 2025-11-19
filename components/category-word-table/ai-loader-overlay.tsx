'use client'

type AiLoaderOverlayProps = {
  visible: boolean
  message?: string
}

export function AiLoaderOverlay({ visible, message }: AiLoaderOverlayProps) {
  if (!visible) {
    return null
  }

  return (
    <div className="bg-background/80 text-muted-foreground absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 rounded-md text-sm">
      <div className="border-border h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
      <span>{message ?? 'Generating suggestions…'}</span>
    </div>
  )
}
