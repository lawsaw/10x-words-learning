'use client'

import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'

import { Button } from '@/components/ui/button'

type WordActionsMenuProps = {
  onEdit: () => void
  onDelete: () => void
  busy?: boolean
}

export function WordActionsMenu({ onEdit, onDelete, busy }: WordActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) {
        return
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleEdit = () => {
    setOpen(false)
    onEdit()
  }

  const handleDelete = () => {
    setOpen(false)
    onDelete()
  }

  return (
    <div ref={containerRef} className="relative inline-flex">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="word-actions-menu"
        onClick={() => setOpen(prev => !prev)}
        disabled={busy}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
        <span className="sr-only">Open word actions</span>
      </Button>

      {open ? (
        <div
          id="word-actions-menu"
          role="menu"
          className="border-border bg-popover absolute top-full right-0 z-40 mt-2 w-36 rounded-md border p-1 shadow-lg"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            disabled={busy}
            className="w-full justify-start gap-2 text-sm"
            role="menuitem"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={busy}
            className="text-destructive hover:text-destructive w-full justify-start gap-2 text-sm"
            role="menuitem"
          >
            <Trash className="h-3.5 w-3.5" aria-hidden />
            Delete
          </Button>
        </div>
      ) : null}
    </div>
  )
}
