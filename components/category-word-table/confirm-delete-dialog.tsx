'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import type { DeleteWordContext } from '@/lib/types'

type ConfirmDeleteDialogProps = {
  open: boolean
  context: DeleteWordContext | null
  onConfirm: (context: DeleteWordContext) => Promise<void>
  onCancel: () => void
  busy: boolean
}

export function ConfirmDeleteDialog({
  open,
  context,
  onConfirm,
  onCancel,
  busy,
}: ConfirmDeleteDialogProps) {
  if (!context) {
    return null
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onCancel()
    }
  }

  const handleConfirm = async () => {
    await onConfirm(context)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete word?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. The word <strong>{context.term}</strong> will be removed
            from the category permanently.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
