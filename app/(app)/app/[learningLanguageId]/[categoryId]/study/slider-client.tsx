"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"

import { ModeToggle } from "@/components/category-word-table/mode-toggle"
import { SliderCard } from "@/components/category-slider/slider-card"
import { WordActionsMenu } from "@/components/category-word-table/word-actions-menu"
import { RenameCategoryDialog } from "@/components/category-word-table/rename-category-dialog"
import { DeleteCategoryDialog } from "@/components/category-word-table/delete-category-dialog"
import { useCategoryWords } from "@/hooks/use-category-words"
import type {
  CategoryWordsListDto,
  SortDirection,
  WordOrderField,
  WordViewMode,
} from "@/lib/types"

type CategorySliderClientProps = {
  categoryId: string
  learningLanguageId: string
  learningLanguageLabel: string
  learningLanguageCode: string
  categoryName: string
  initialWords: CategoryWordsListDto
}

type SliderCardVm = {
  id: string
  term: string
  translation: string
  examples?: string
}

export default function CategorySliderClient({
  categoryId,
  learningLanguageId,
  learningLanguageLabel,
  learningLanguageCode,
  categoryName,
  initialWords,
}: CategorySliderClientProps) {
  const router = useRouter()
  const [orderBy, setOrderBy] = useState<WordOrderField>("createdAt")
  const [direction, setDirection] = useState<SortDirection>("asc")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [headingActionsContainer, setHeadingActionsContainer] = useState<Element | null>(null)
  const [descriptionActionsContainer, setDescriptionActionsContainer] =
    useState<Element | null>(null)
  const [categoryActionsBusy, setCategoryActionsBusy] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false)
  const [deleteCategoryError, setDeleteCategoryError] = useState<string | null>(null)
  const [displayCategoryName, setDisplayCategoryName] = useState(categoryName)

  const handleModeChange = useCallback(
    (mode: "table" | "slider") => {
      if (mode === "table") {
        router.push(`/app/${learningLanguageId}/${categoryId}`)
      }
    },
    [router, learningLanguageId, categoryId],
  )

  useEffect(() => {
    setHeadingActionsContainer(document.getElementById("app-shell-heading-actions"))
    setDescriptionActionsContainer(
      document.getElementById("app-shell-description-actions"),
    )
  }, [])

useEffect(() => {
  setDisplayCategoryName(categoryName)
}, [categoryName])

  const {
    data: wordsData,
    error: wordsError,
    isLoading,
    mutate,
  } = useCategoryWords({
    categoryId,
    view: "slider",
    orderBy,
    direction,
    initialData: initialWords,
  })

  const payload = wordsData ?? initialWords

  const cards = useMemo<SliderCardVm[]>(
    () =>
      payload.data.map((word) => ({
        id: word.id,
        term: word.term,
        translation: word.translation,
        examples: word.examplesMd,
      })),
    [payload],
  )

  const totalCards = cards.length
  const currentCard = cards[currentIndex] ?? cards[0]
  const [showTranslationFirst, setShowTranslationFirst] = useState(false)

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev))
    setRevealed(false)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < totalCards - 1 ? prev + 1 : prev))
    setRevealed(false)
  }

  const hasMultipleCards = totalCards > 1

  useEffect(() => {
    if (currentIndex >= totalCards) {
      setCurrentIndex(totalCards > 0 ? totalCards - 1 : 0)
      setRevealed(false)
    }
  }, [currentIndex, totalCards])

  const handleShuffle = () => {
    setOrderBy("random")
    setDirection("asc")
    setCurrentIndex(0)
    setRevealed(false)
    void mutate()
  }

  const handleResetOrder = () => {
    setOrderBy("createdAt")
    setDirection("asc")
    setCurrentIndex(0)
    setRevealed(false)
    void mutate()
  }

  const handleReverse = () => {
    setOrderBy("createdAt")
    setDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    setCurrentIndex(0)
    setRevealed(false)
    void mutate()
  }

const handleOpenRenameDialog = useCallback(() => {
  setRenameError(null)
  setRenameDialogOpen(true)
}, [])

const handleCancelRename = useCallback(() => {
  setRenameDialogOpen(false)
  setRenameError(null)
}, [])

const handleRenameCategory = useCallback(
  async (name: string) => {
    setCategoryActionsBusy(true)
    setRenameError(null)
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload?.error?.message ?? "Failed to rename category."
        throw new Error(message)
      }

      setDisplayCategoryName(name)
      setRenameDialogOpen(false)
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to rename category."
      setRenameError(message)
    } finally {
      setCategoryActionsBusy(false)
    }
  },
  [categoryId, router],
)

const handleOpenDeleteCategory = useCallback(() => {
  setDeleteCategoryError(null)
  setDeleteCategoryDialogOpen(true)
}, [])

const handleCancelDeleteCategory = useCallback(() => {
  setDeleteCategoryDialogOpen(false)
  setDeleteCategoryError(null)
}, [])

const handleDeleteCategory = useCallback(async () => {
  setCategoryActionsBusy(true)
  setDeleteCategoryError(null)
  try {
    const response = await fetch(`/api/categories/${categoryId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      const message = payload?.error?.message ?? "Failed to delete category."
      throw new Error(message)
    }

    setDeleteCategoryDialogOpen(false)
    router.push(`/app/${learningLanguageId}`)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete category."
    setDeleteCategoryError(message)
  } finally {
    setCategoryActionsBusy(false)
  }
}, [categoryId, learningLanguageId, router])

  return (
    <div className="flex flex-col gap-8">
      {headingActionsContainer &&
        createPortal(
          <WordActionsMenu
            onEdit={handleOpenRenameDialog}
            onDelete={handleOpenDeleteCategory}
            busy={categoryActionsBusy}
          />,
          headingActionsContainer,
        )}
      {descriptionActionsContainer &&
        createPortal(
          <ModeToggle value="slider" onChange={handleModeChange} />,
          descriptionActionsContainer,
        )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          onClick={handleShuffle}
          disabled={isLoading}
        >
          Shuffle cards
        </button>
        <button
          type="button"
          className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          onClick={handleResetOrder}
          disabled={isLoading || orderBy !== "random"}
        >
          Reset order
        </button>
        <button
          type="button"
          className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          onClick={handleReverse}
          disabled={isLoading || orderBy === "random"}
        >
          {direction === "asc" ? "Newest first" : "Oldest first"}
        </button>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring"
            checked={showTranslationFirst}
            onChange={(event) => {
              setShowTranslationFirst(event.target.checked)
              setRevealed(false)
            }}
          />
          Show term first
        </label>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-card/30 px-6 py-16 text-sm text-muted-foreground">
          Loading slider cards…
        </div>
      ) : totalCards === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <h3 className="text-base font-semibold text-foreground">No words yet</h3>
          <p className="text-sm text-muted-foreground">
            Add words in table mode to start studying with the slider.
          </p>
          <button
            type="button"
            className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground cursor-pointer"
            onClick={() => router.push(`/app/${learningLanguageId}/${categoryId}`)}
          >
            Go to table view
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-4">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Card {Math.min(currentIndex + 1, totalCards)} of {totalCards}
            </span>
            <SliderCard
              term={currentCard?.term ?? "No cards yet"}
              translation={currentCard?.translation ?? "Add words to populate slider view"}
              examples={currentCard?.examples}
              revealed={revealed}
              onReveal={() => setRevealed(true)}
              onHide={() => setRevealed(false)}
              showTermFirst={showTranslationFirst}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:text-border cursor-pointer"
              onClick={handlePrev}
              disabled={!hasMultipleCards || currentIndex === 0}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:text-border cursor-pointer"
              onClick={handleNext}
              disabled={!hasMultipleCards || currentIndex >= totalCards - 1}
            >
              Next
            </button>
          </div>
        </>
      )}

      {wordsError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {wordsError.message ?? "Failed to load slider cards."}
        </div>
      ) : null}
      <RenameCategoryDialog
        open={renameDialogOpen}
        initialName={displayCategoryName}
        busy={categoryActionsBusy}
        error={renameError}
        onSubmit={handleRenameCategory}
        onCancel={handleCancelRename}
      />
      <DeleteCategoryDialog
        open={deleteCategoryDialogOpen}
        categoryName={displayCategoryName}
        busy={categoryActionsBusy}
        error={deleteCategoryError}
        onConfirm={handleDeleteCategory}
        onCancel={handleCancelDeleteCategory}
      />
    </div>
  )
}

