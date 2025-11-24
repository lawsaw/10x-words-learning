'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'

import { WordActionsMenu } from '@/components/category-word-table/word-actions-menu'
import { DeleteCategoryDialog } from '@/components/category-word-table/delete-category-dialog'
import { WordToolbar } from '@/components/category-word-table/word-toolbar'
import { WordTable } from '@/components/category-word-table/word-table'
import { TableEmptyState } from '@/components/category-word-table/table-empty-state'
import { PaginationHint } from '@/components/category-word-table/pagination-hint'
import { WordFormModal } from '@/components/category-word-table/word-form-modal'
import { ConfirmDeleteDialog } from '@/components/category-word-table/confirm-delete-dialog'
import { RenameCategoryDialog } from '@/components/category-word-table/rename-category-dialog'
import type {
  CategoryWordsListDto,
  DeleteWordContext,
  SortDirection,
  WordFormState,
  WordOrderField,
  WordTableRowVm,
  WordTableViewModel,
} from '@/lib/types'
import { useCategoryWords } from '@/hooks/use-category-words'
import { useWordMutations } from '@/hooks/use-word-mutations'
import { useAiWordGeneration } from '@/hooks/use-ai-word-generation'

type CategoryWordTableClientProps = {
  categoryId: string
  learningLanguageId: string
  categoryName: string
  userLanguage: string
  initialWords: CategoryWordsListDto
  learningLanguageLabel: string
  learningLanguageCode: string
}

const DEFAULT_ORDER: WordOrderField = 'createdAt'
const DEFAULT_DIRECTION: SortDirection = 'desc'
const DEFAULT_DIFFICULTY: WordFormState['difficulty'] = 'medium'

type FeedbackType = 'success' | 'error'
type FeedbackMessage = {
  type: FeedbackType
  message: string
}

export default function CategoryWordTableClient({
  categoryId,
  learningLanguageId,
  categoryName,
  userLanguage,
  initialWords,
  learningLanguageLabel,
  learningLanguageCode: _learningLanguageCode,
}: CategoryWordTableClientProps) {
  const router = useRouter()

  const [orderBy, setOrderBy] = useState<WordOrderField>(DEFAULT_ORDER)
  const [direction, setDirection] = useState<SortDirection>(DEFAULT_DIRECTION)
  const [isWordModalOpen, setWordModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [formState, setFormState] = useState<WordFormState>({
    term: '',
    translation: '',
    examplesMd: '',
    difficulty: DEFAULT_DIFFICULTY,
  })
  const [deleteContext, setDeleteContext] = useState<DeleteWordContext | null>(null)
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)
  const [displayCategoryName, setDisplayCategoryName] = useState(categoryName)
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false)
  const [deleteCategoryError, setDeleteCategoryError] = useState<string | null>(null)
  const [recentAiTerms, setRecentAiTerms] = useState<string[]>([])
  const [headingActionsContainer, setHeadingActionsContainer] = useState<Element | null>(null)

  useEffect(() => {
    setDisplayCategoryName(categoryName)
  }, [categoryName])

  useEffect(() => {
    setHeadingActionsContainer(document.getElementById('app-shell-heading-actions'))
  }, [])
  const [categoryActionsBusy, setCategoryActionsBusy] = useState(false)

  const showFeedback = useCallback((type: FeedbackType, message: string) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
    }
    setFeedback({ type, message })
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null)
    }, 4000)
  }, [])

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current)
      }
    }
  }, [])

  const {
    data: wordsData,
    error: wordsError,
    isLoading,
    mutate,
  } = useCategoryWords({
    categoryId,
    view: 'table',
    orderBy,
    direction,
    initialData: initialWords,
    onError: message => showFeedback('error', message),
  })

  const wordMutations = useWordMutations({
    categoryId,
    onMutated: async () => {
      await mutate()
    },
    onError: message => showFeedback('error', message),
  })

  const aiGeneration = useAiWordGeneration({
    categoryId,
    learningLanguageId,
    learningLanguageName: learningLanguageLabel,
    userLanguage,
    categoryName: displayCategoryName,
    excludeTerms: recentAiTerms,
  })

  const handleRenameCategory = useCallback(
    async (name: string) => {
      setCategoryActionsBusy(true)
      setRenameError(null)
      try {
        const response = await fetch(`/api/categories/${categoryId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          const message = payload?.error?.message ?? 'Failed to rename category.'
          throw new Error(message)
        }

        showFeedback('success', 'Category renamed successfully.')
        setDisplayCategoryName(name)
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to rename category.'
        setRenameError(message)
        showFeedback('error', message)
        throw error
      } finally {
        setCategoryActionsBusy(false)
        setRenameDialogOpen(false)
      }
    },
    [categoryId, showFeedback, router]
  )

  const confirmDeleteCategory = useCallback(async () => {
    setCategoryActionsBusy(true)
    setDeleteCategoryError(null)
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload?.error?.message ?? 'Failed to delete category.'
        throw new Error(message)
      }

      showFeedback('success', 'Category deleted successfully.')
      setDeleteCategoryDialogOpen(false)
      router.push(`/app/${learningLanguageId}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete category.'
      setDeleteCategoryError(message)
      showFeedback('error', message)
      throw error
    } finally {
      setCategoryActionsBusy(false)
    }
  }, [categoryId, learningLanguageId, router, showFeedback])

  const payload = wordsData ?? initialWords

  const tableViewModel = useMemo<WordTableViewModel>(() => {
    return createWordTableViewModel(payload)
  }, [payload])

  const isMutating = Boolean(wordMutations.busy)

  const handleOpenCreateModal = useCallback(() => {
    setModalMode('create')
    setFormState({
      term: '',
      translation: '',
      examplesMd: '',
      difficulty: DEFAULT_DIFFICULTY,
    })
    setWordModalOpen(true)
  }, [])

  const handleOpenEditModal = useCallback(
    (wordId: string) => {
      const word = payload.data.find(item => item.id === wordId)

      if (!word) {
        return
      }

      setModalMode('edit')
      setFormState({
        wordId: word.id,
        term: word.term,
        translation: word.translation,
        examplesMd: word.examplesMd ?? '',
        difficulty: DEFAULT_DIFFICULTY,
      })
      setWordModalOpen(true)
    },
    [payload.data]
  )

  const closeModal = useCallback(() => {
    setWordModalOpen(false)
    setFormState({
      term: '',
      translation: '',
      examplesMd: '',
      difficulty: DEFAULT_DIFFICULTY,
    })
    setRecentAiTerms([])
  }, [])

  const handleSaveWord = useCallback(
    async (state: WordFormState) => {
      if (!state.term.trim() || !state.translation.trim()) {
        return
      }

      try {
        if (modalMode === 'create') {
          await wordMutations.createWord({
            term: state.term.trim(),
            translation: state.translation.trim(),
            examplesMd: state.examplesMd.trim(),
          })
          showFeedback('success', 'Word created successfully.')
        } else if (state.wordId) {
          await wordMutations.updateWord(state.wordId, {
            term: state.term.trim(),
            translation: state.translation.trim(),
            examplesMd: state.examplesMd.trim(),
          })
          showFeedback('success', 'Word updated successfully.')
        }

        closeModal()
      } catch (error) {
        throw error
      }
    },
    [wordMutations, modalMode, closeModal, showFeedback]
  )

  const handleDeleteWord = useCallback((context: DeleteWordContext) => {
    setDeleteContext(context)
  }, [])

  const handleOpenRenameDialog = useCallback(() => {
    setRenameError(null)
    setRenameDialogOpen(true)
  }, [])

  const handleCancelRename = useCallback(() => {
    setRenameDialogOpen(false)
    setRenameError(null)
  }, [])

  const handleOpenDeleteCategory = useCallback(() => {
    setDeleteCategoryError(null)
    setDeleteCategoryDialogOpen(true)
  }, [])

  const handleCancelDeleteCategory = useCallback(() => {
    setDeleteCategoryDialogOpen(false)
    setDeleteCategoryError(null)
  }, [])

  const confirmDelete = useCallback(
    async (context: DeleteWordContext) => {
      await wordMutations.deleteWord(context.wordId)
      setDeleteContext(null)
      showFeedback('success', 'Word deleted successfully.')
    },
    [wordMutations, showFeedback]
  )

  const cancelDelete = useCallback(() => {
    setDeleteContext(null)
  }, [])

  const handleSortChange = useCallback(
    (nextOrder: WordOrderField, nextDirection: SortDirection) => {
      setOrderBy(nextOrder)
      setDirection(nextDirection)
    },
    []
  )

  const handleGenerate = useCallback(
    async (difficulty: WordFormState['difficulty']) => {
      aiGeneration.resetError()
      const suggestion = await aiGeneration.generate(difficulty)
      if (!suggestion) {
        return null
      }

      setFormState(prev => ({
        ...prev,
        term: suggestion.term,
        translation: suggestion.translation,
        examplesMd: suggestion.examplesMd,
        difficulty,
      }))
      const normalizedTerm = suggestion.term.toLowerCase().trim()
      setRecentAiTerms(prev =>
        normalizedTerm && !prev.includes(normalizedTerm) ? [...prev, normalizedTerm] : prev
      )
      return suggestion
    },
    [aiGeneration]
  )

  return (
    <div className="flex flex-col gap-6">
      {headingActionsContainer &&
        createPortal(
          <WordActionsMenu
            onEdit={handleOpenRenameDialog}
            onDelete={handleOpenDeleteCategory}
            busy={categoryActionsBusy}
          />,
          headingActionsContainer
        )}
      {feedback ? (
        <div
          className={`rounded-md border px-4 py-2 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-destructive/40 bg-destructive/10 text-destructive'
          }`}
          role="status"
          aria-live="polite"
        >
          {feedback.message}
        </div>
      ) : null}

      <WordToolbar
        onCreate={handleOpenCreateModal}
        orderBy={orderBy}
        direction={direction}
        onSortChange={handleSortChange}
        wordCount={tableViewModel.count}
        busy={isMutating || isLoading}
      />

      {wordsError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm">
          Failed to load words. Please try again.
        </div>
      ) : null}

      {tableViewModel.isEmpty ? (
        <TableEmptyState onCreate={handleOpenCreateModal} />
      ) : (
        <WordTable
          rows={tableViewModel.rows}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteWord}
          busy={isMutating}
        />
      )}

      <PaginationHint meta={tableViewModel.meta} />

      <WordFormModal
        open={isWordModalOpen}
        mode={modalMode}
        initialValue={formState}
        onClose={closeModal}
        onSubmit={async (payload, wordId) => {
          const nextState: WordFormState = {
            wordId,
            term: 'term' in payload && payload.term ? payload.term : formState.term,
            translation:
              'translation' in payload && payload.translation
                ? payload.translation
                : formState.translation,
            examplesMd:
              'examplesMd' in payload && payload.examplesMd !== undefined
                ? payload.examplesMd
                : formState.examplesMd,
            difficulty: formState.difficulty,
          }
          await handleSaveWord(nextState)
        }}
        onAiGenerate={handleGenerate}
        busy={isMutating}
        aiBusy={aiGeneration.aiBusy}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteContext)}
        context={deleteContext}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        busy={wordMutations.busy === 'delete'}
      />

      <RenameCategoryDialog
        open={renameDialogOpen}
        initialName={displayCategoryName}
        busy={categoryActionsBusy}
        error={renameError}
        onSubmit={name => handleRenameCategory(name)}
        onCancel={handleCancelRename}
      />

      <DeleteCategoryDialog
        open={deleteCategoryDialogOpen}
        categoryName={displayCategoryName}
        busy={categoryActionsBusy}
        error={deleteCategoryError}
        onConfirm={confirmDeleteCategory}
        onCancel={handleCancelDeleteCategory}
      />

      {aiGeneration.error ? (
        <div className="border-warning/40 bg-warning/10 text-warning-foreground rounded-md border px-4 py-3 text-sm">
          {aiGeneration.error}
        </div>
      ) : null}
    </div>
  )
}

function createWordTableViewModel(payload: CategoryWordsListDto): WordTableViewModel {
  const rows: WordTableRowVm[] = payload.data.map(word => ({
    id: word.id,
    term: word.term,
    translation: word.translation,
    examplesMd: word.examplesMd ?? '',
    createdAt: word.createdAt,
    updatedAt: word.updatedAt,
    createdAtLabel: formatTimestamp(word.createdAt),
    updatedAtLabel: formatTimestamp(word.updatedAt),
  }))

  return {
    rows,
    meta: payload.meta,
    count: rows.length,
    isEmpty: rows.length === 0,
  }
}

function formatTimestamp(input: string): string {
  try {
    const date = new Date(input)
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  } catch {
    return input
  }
}
