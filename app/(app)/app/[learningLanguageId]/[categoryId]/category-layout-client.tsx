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
  const [containers, setContainers] = useState<{
    actions: Element | null
    description: Element | null
  }>({
    actions: null,
    description: null,
  })

  useEffect(() => {
    const actions = document.getElementById('app-shell-description-actions')
    const description = document.getElementById('app-shell-description')

    if (actions !== containers.actions || description !== containers.description) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContainers({ actions, description })
    }
  }, [pathname, containers.actions, containers.description])

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
      {containers.actions &&
        createPortal(
          <ModeToggle value={currentMode} tableHref={tableHref} sliderHref={sliderHref} />,
          containers.actions
        )}
      {containers.description &&
        createPortal(<p className="m-0">{descriptionText}</p>, containers.description)}
      {children}
    </>
  )
}
