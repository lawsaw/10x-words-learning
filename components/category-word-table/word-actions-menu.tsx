'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'

import { Button } from '@/components/ui/button'

type WordActionsMenuProps = {
  onEdit: () => void
  onDelete: () => void
  busy?: boolean
}

export function WordActionsMenu({ onEdit, onDelete, busy }: WordActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    // Calculate dropdown position
    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.right + window.scrollX - 144, // 144px = w-36 (9rem * 16px)
        })
      }
    }

    updatePosition()

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node

      // Don't close if clicking inside the button or dropdown
      if (
        (containerRef.current && containerRef.current.contains(target)) ||
        (dropdownRef.current && dropdownRef.current.contains(target))
      ) {
        return
      }

      setOpen(false)
    }

    // Update position on scroll and resize
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
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
        ref={buttonRef}
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

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            id="word-actions-menu"
            role="menu"
            className="border-border bg-popover fixed z-50 w-36 rounded-md border p-1 shadow-lg"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
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
          </div>,
          document.body
        )}
    </div>
  )
}
