"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

type CreateWordButtonProps = {
  onClick: () => void
  disabled?: boolean
}

export function CreateWordButton({ onClick, disabled }: CreateWordButtonProps) {
  return (
    <Button type="button" size="sm" onClick={onClick} disabled={disabled}>
      <Plus className="mr-2 h-4 w-4" aria-hidden />
      Add word
    </Button>
  )
}
