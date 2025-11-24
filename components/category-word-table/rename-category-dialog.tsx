'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

type RenameCategoryDialogProps = {
  open: boolean
  initialName: string
  busy?: boolean
  error?: string | null
  onSubmit: (name: string) => Promise<void> | void
  onCancel: () => void
}

export function RenameCategoryDialog({
  open,
  initialName,
  busy,
  error,
  onSubmit,
  onCancel,
}: RenameCategoryDialogProps) {
  const [name, setName] = useState(initialName)
  const [touched, setTouched] = useState(false)

  // Sync local state with initialName prop when it changes
  const [prevInitialName, setPrevInitialName] = useState(initialName)
  if (initialName !== prevInitialName) {
    setPrevInitialName(initialName)
    setName(initialName)
    setTouched(false)
  }

  const trimmedName = name.trim()
  const hasError = touched && !trimmedName

  return (
    <Dialog open={open} onOpenChange={next => (!next ? onCancel() : undefined)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rename category</DialogTitle>
          <DialogDescription>
            Update the category name to help organize your vocabulary library.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <label className="text-foreground text-sm font-medium" htmlFor="rename-category-input">
            Category name
          </label>
          <Input
            id="rename-category-input"
            value={name}
            onChange={event => setName(event.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="e.g. Travel essentials"
            disabled={busy}
          />
          {hasError ? <p className="text-destructive text-xs">Category name is required.</p> : null}
          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              setTouched(true)
              if (!trimmedName) {
                return
              }
              void onSubmit(trimmedName)
            }}
            disabled={busy || !trimmedName}
          >
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
