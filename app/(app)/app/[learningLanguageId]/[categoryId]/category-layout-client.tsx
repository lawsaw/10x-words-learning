'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'

import { ModeToggle } from '@/components/category-word-table/mode-toggle'
import type { WordViewMode } from '@/lib/types'

type CategoryLayoutClientProps = {
  children: ReactNode
  learningLanguageId: string
  learningLanguageName: string
  categoryId: string
}

export function CategoryLayoutClient({
  children,
  learningLanguageId,
  learningLanguageName,
  categoryId,
}: CategoryLayoutClientProps) {
  const pathname = usePathname()
  const [descriptionActionsContainer, setDescriptionActionsContainer] = useState<Element | null>(
    null
  )
  const [descriptionContainer, setDescriptionContainer] = useState<Element | null>(null)

  useEffect(() => {
    const actions = document.getElementById('app-shell-description-actions')
    const description = document.getElementById('app-shell-description')
    setDescriptionActionsContainer(actions)
    setDescriptionContainer(description)

    return () => {
      setDescriptionActionsContainer(null)
      setDescriptionContainer(null)
    }
  }, [pathname])

  // Determine current mode based on pathname
  const currentMode: WordViewMode = pathname.endsWith('/study') ? 'slider' : 'table'
  const tableHref = `/app/${learningLanguageId}/${categoryId}`
  const sliderHref = `/app/${learningLanguageId}/${categoryId}/study`
  const descriptionText =
    currentMode === 'slider'
      ? `Study ${learningLanguageName} words from this category with the flashcard slider experience.`
      : `Manage and review ${learningLanguageName} words in a structured table for quick edits.`

  return (
    <>
      {descriptionActionsContainer &&
        createPortal(
          <ModeToggle value={currentMode} tableHref={tableHref} sliderHref={sliderHref} />,
          descriptionActionsContainer
        )}
      {descriptionContainer &&
        createPortal(<p className="m-0">{descriptionText}</p>, descriptionContainer)}
      {children}
    </>
  )
}
