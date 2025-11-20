'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, FolderPlus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type LearningLanguageSummary = {
  id: string
  code: string
  name: string
  categories: Array<{ id: string; name: string; wordCount: number }>
}

type WorkspaceClientProps = {
  initialSummaries: LearningLanguageSummary[]
}

type FeedbackType = 'success' | 'error'

type FeedbackMessage = {
  type: FeedbackType
  message: string
}

type LanguageOption = {
  code: string
  name: string
}

type LanguagesListDto = {
  languages: LanguageOption[]
}

export default function WorkspaceClient({ initialSummaries }: WorkspaceClientProps) {
  const router = useRouter()
  const summaries = useMemo(
    () => initialSummaries.filter(summary => Boolean(summary.id)),
    [initialSummaries]
  )

  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [createLanguageOpen, setCreateLanguageOpen] = useState(false)
  const [createLanguageBusy, setCreateLanguageBusy] = useState(false)
  const [languageOptions, setLanguageOptions] = useState<LanguageOption[]>([])
  const [languageOptionsLoading, setLanguageOptionsLoading] = useState(false)
  const [languageOptionsError, setLanguageOptionsError] = useState<string | null>(null)
  const [selectedLanguageCode, setSelectedLanguageCode] = useState('')
  const [createLanguageError, setCreateLanguageError] = useState<string | null>(null)

  const [createCategoryOpen, setCreateCategoryOpen] = useState(false)
  const [createCategoryBusy, setCreateCategoryBusy] = useState(false)
  const [selectedCategoryLanguage, setSelectedCategoryLanguage] = useState<string>(
    summaries[0]?.id ?? ''
  )
  const [categoryName, setCategoryName] = useState('')
  const [createCategoryError, setCreateCategoryError] = useState<string | null>(null)

  const [deleteLanguageOpen, setDeleteLanguageOpen] = useState(false)
  const [deleteLanguageBusy, setDeleteLanguageBusy] = useState(false)
  const [languageToDelete, setLanguageToDelete] = useState<{ id: string; name: string } | null>(
    null
  )
  const [deleteLanguageError, setDeleteLanguageError] = useState<string | null>(null)

  const hasLearningLanguages = summaries.length > 0

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

  const loadLanguageOptions = useCallback(async () => {
    setLanguageOptionsLoading(true)
    setLanguageOptionsError(null)
    try {
      const response = await fetch('/api/languages?scope=learning', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload?.error?.message ?? 'Unable to fetch languages.'
        throw new Error(message)
      }

      const payload = (await response.json()) as LanguagesListDto
      const options = payload.languages ?? []
      setLanguageOptions(options)
      if (options.length > 0) {
        setSelectedLanguageCode(current => current || options[0].code)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load languages.'
      setLanguageOptionsError(message)
    } finally {
      setLanguageOptionsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (createLanguageOpen && languageOptions.length === 0 && !languageOptionsLoading) {
      void loadLanguageOptions()
    }
  }, [createLanguageOpen, languageOptions.length, languageOptionsLoading, loadLanguageOptions])

  const resetLanguageForm = () => {
    setSelectedLanguageCode(languageOptions[0]?.code ?? '')
    setCreateLanguageError(null)
  }

  const resetCategoryForm = (targetLanguageId?: string) => {
    setSelectedCategoryLanguage(targetLanguageId ?? summaries[0]?.id ?? '')
    setCategoryName('')
    setCreateCategoryError(null)
  }

  const closeLanguageDialog = () => {
    setCreateLanguageOpen(false)
    setCreateLanguageBusy(false)
    setCreateLanguageError(null)
  }

  const closeCategoryDialog = () => {
    setCreateCategoryOpen(false)
    setCreateCategoryBusy(false)
    setCreateCategoryError(null)
  }

  const closeDeleteLanguageDialog = () => {
    setDeleteLanguageOpen(false)
    setDeleteLanguageBusy(false)
    setLanguageToDelete(null)
    setDeleteLanguageError(null)
  }

  const handleCreateLanguage = async () => {
    const languageId = selectedLanguageCode.trim()
    if (!languageId) {
      setCreateLanguageError('Select a learning language to add.')
      return
    }

    setCreateLanguageBusy(true)
    setCreateLanguageError(null)
    try {
      const response = await fetch('/api/learning-languages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ languageId }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload?.error?.message ?? 'Failed to create learning language.'
        throw new Error(message)
      }

      closeLanguageDialog()
      showFeedback('success', 'Learning language added successfully.')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create learning language.'
      setCreateLanguageError(message)
    } finally {
      setCreateLanguageBusy(false)
    }
  }

  const handleCreateCategory = async () => {
    const trimmedName = categoryName.trim()
    if (!selectedCategoryLanguage) {
      setCreateCategoryError('Select a learning language.')
      return
    }
    if (!trimmedName) {
      setCreateCategoryError('Category name is required.')
      return
    }

    setCreateCategoryBusy(true)
    setCreateCategoryError(null)
    try {
      const response = await fetch(
        `/api/learning-languages/${selectedCategoryLanguage}/categories`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: trimmedName }),
        }
      )

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload?.error?.message ?? 'Failed to create category.'
        throw new Error(message)
      }

      const payload = (await response.json()) as { id: string }
      closeCategoryDialog()
      showFeedback('success', 'Category created successfully.')
      if (payload?.id) {
        router.push(`/app/${selectedCategoryLanguage}/${payload.id}`)
      } else {
        router.refresh()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create category.'
      setCreateCategoryError(message)
    } finally {
      setCreateCategoryBusy(false)
    }
  }

  const handleOpenCategoryDialog = useCallback(
    (learningLanguageId?: string) => {
      const targetId = learningLanguageId ?? summaries[0]?.id ?? ''
      resetCategoryForm(targetId)
      setCreateCategoryOpen(true)
    },
    [summaries]
  )

  const handleOpenLanguageDialog = () => {
    resetLanguageForm()
    setCreateLanguageOpen(true)
  }

  const handleOpenDeleteDialog = useCallback((languageId: string, languageName: string) => {
    setLanguageToDelete({ id: languageId, name: languageName })
    setDeleteLanguageError(null)
    setDeleteLanguageOpen(true)
  }, [])

  const handleDeleteLanguage = async () => {
    if (!languageToDelete) return

    setDeleteLanguageBusy(true)
    setDeleteLanguageError(null)
    try {
      const response = await fetch(`/api/learning-languages/${languageToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload?.error?.message ?? 'Failed to delete learning language.'
        throw new Error(message)
      }

      closeDeleteLanguageDialog()
      showFeedback('success', 'Learning language deleted successfully.')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete learning language.'
      setDeleteLanguageError(message)
    } finally {
      setDeleteLanguageBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      {feedback ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
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

      <div className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm">
          <h2 className="text-foreground text-base font-semibold">Workspace overview</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            onClick={handleOpenLanguageDialog}
            data-test-id="add-learning-language-button"
          >
            Add learning language
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenCategoryDialog()}
            disabled={!hasLearningLanguages}
            data-test-id="add-category-button"
          >
            Add category
          </Button>
        </div>
      </div>

      {summaries.length === 0 ? (
        <div
          className="border-border bg-card/40 flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed px-6 py-16 text-center"
          data-test-id="empty-state"
        >
          <div className="space-y-2">
            <h3 className="text-foreground text-base font-semibold">No learning languages yet</h3>
            <p className="text-muted-foreground text-sm">
              Add your first learning language to start creating categories and studying new words.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleOpenLanguageDialog}
            data-test-id="add-learning-language-button"
          >
            Add learning language
          </Button>
        </div>
      ) : (
        <LanguageList
          summaries={summaries}
          onCreateCategory={handleOpenCategoryDialog}
          onDeleteLanguage={handleOpenDeleteDialog}
        />
      )}

      <CreateLearningLanguageDialog
        open={createLanguageOpen}
        onOpenChange={next => {
          if (!next) {
            closeLanguageDialog()
          } else {
            setCreateLanguageOpen(true)
          }
        }}
        options={languageOptions}
        optionsLoading={languageOptionsLoading}
        optionsError={languageOptionsError}
        selectedLanguageCode={selectedLanguageCode}
        onSelectedLanguageChange={setSelectedLanguageCode}
        onRetryLoad={loadLanguageOptions}
        busy={createLanguageBusy}
        error={createLanguageError}
        onSubmit={handleCreateLanguage}
        onCancel={closeLanguageDialog}
      />

      <CreateCategoryDialog
        open={createCategoryOpen}
        onOpenChange={next => {
          if (!next) {
            closeCategoryDialog()
          } else {
            setCreateCategoryOpen(true)
          }
        }}
        summaries={summaries}
        selectedLearningLanguage={selectedCategoryLanguage}
        onLearningLanguageChange={setSelectedCategoryLanguage}
        categoryName={categoryName}
        onCategoryNameChange={setCategoryName}
        busy={createCategoryBusy}
        error={createCategoryError}
        onSubmit={handleCreateCategory}
        onCancel={closeCategoryDialog}
      />

      <DeleteLearningLanguageDialog
        open={deleteLanguageOpen}
        onOpenChange={next => {
          if (!next) {
            closeDeleteLanguageDialog()
          } else {
            setDeleteLanguageOpen(true)
          }
        }}
        languageName={languageToDelete?.name ?? ''}
        busy={deleteLanguageBusy}
        error={deleteLanguageError}
        onConfirm={handleDeleteLanguage}
        onCancel={closeDeleteLanguageDialog}
      />
    </div>
  )
}

type LanguageListProps = {
  summaries: LearningLanguageSummary[]
  onCreateCategory: (learningLanguageId: string) => void
  onDeleteLanguage: (learningLanguageId: string, languageName: string) => void
}

function LanguageList({ summaries, onCreateCategory, onDeleteLanguage }: LanguageListProps) {
  return (
    <div className="space-y-8">
      {summaries.map(summary => (
        <section
          key={summary.id}
          className="border-border bg-card space-y-3 rounded-lg border p-4 shadow-sm"
          data-test-id={`language-section-${summary.code}`}
        >
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3
                className="text-foreground text-base font-semibold"
                data-test-id={`language-name-${summary.code}`}
              >
                {summary.name}{' '}
                <span className="text-muted-foreground text-sm">({summary.code})</span>
              </h3>
              {summary.categories.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  No categories yet. Create one to populate this learning language.
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  {summary.categories.length} categor{summary.categories.length === 1 ? 'y' : 'ies'}{' '}
                  available.
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  data-test-id={`language-menu-${summary.code}`}
                  aria-label={`Actions for ${summary.name}`}
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Open actions menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => onCreateCategory(summary.id)}
                  data-test-id={`add-category-${summary.code}`}
                  className="gap-2"
                >
                  <FolderPlus className="h-3.5 w-3.5" aria-hidden />
                  Add category
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDeleteLanguage(summary.id, summary.name)}
                  className="text-destructive focus:text-destructive gap-2"
                  data-test-id={`delete-language-${summary.code}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Delete language
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {summary.categories.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {summary.categories.map(category => (
                <li key={category.id}>
                  <Link
                    href={`/app/${summary.id}/${category.id}`}
                    className="border-border bg-muted hover:border-foreground hover:bg-muted/50 flex flex-col gap-2 rounded-lg border px-4 py-3 transition"
                  >
                    <span className="text-foreground text-sm font-medium">{category.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {category.wordCount} word{category.wordCount === 1 ? '' : 's'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  )
}

type CreateLearningLanguageDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: LanguageOption[]
  optionsLoading: boolean
  optionsError: string | null
  selectedLanguageCode: string
  onSelectedLanguageChange: (value: string) => void
  onRetryLoad: () => Promise<void>
  busy: boolean
  error: string | null
  onSubmit: () => Promise<void> | void
  onCancel: () => void
}

function CreateLearningLanguageDialog({
  open,
  onOpenChange,
  options,
  optionsLoading,
  optionsError,
  selectedLanguageCode,
  onSelectedLanguageChange,
  onRetryLoad,
  busy,
  error,
  onSubmit,
  onCancel,
}: CreateLearningLanguageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-test-id="add-learning-language-dialog">
        <DialogHeader>
          <DialogTitle>Add learning language</DialogTitle>
          <DialogDescription>
            Select a language you would like to study. Each learning language can contain multiple
            categories.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {optionsLoading ? (
            <p className="text-muted-foreground text-sm">Loading languages…</p>
          ) : optionsError ? (
            <div className="text-destructive space-y-2 text-sm">
              <p>{optionsError}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void onRetryLoad()}>
                Retry
              </Button>
            </div>
          ) : options.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No additional languages are available right now.
            </p>
          ) : (
            <div className="grid gap-2">
              <label
                className="text-foreground text-sm font-medium"
                htmlFor="learning-language-select"
              >
                Learning language
              </label>
              <Select
                value={selectedLanguageCode || undefined}
                onValueChange={onSelectedLanguageChange}
                disabled={busy}
              >
                <SelectTrigger
                  id="learning-language-select"
                  className="h-9 w-full px-3 text-sm"
                  data-test-id="language-select-trigger"
                >
                  <SelectValue placeholder="Select learning language" />
                </SelectTrigger>
                <SelectContent>
                  {options.map(option => (
                    <SelectItem
                      key={option.code}
                      value={option.code}
                      data-test-id={`language-option-${option.code}`}
                    >
                      {option.name} ({option.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={busy}
            data-test-id="dialog-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void onSubmit()}
            disabled={busy || options.length === 0}
            data-test-id="dialog-submit"
          >
            {busy ? 'Adding…' : 'Add language'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type CreateCategoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  summaries: LearningLanguageSummary[]
  selectedLearningLanguage: string
  onLearningLanguageChange: (value: string) => void
  categoryName: string
  onCategoryNameChange: (value: string) => void
  busy: boolean
  error: string | null
  onSubmit: () => Promise<void> | void
  onCancel: () => void
}

function CreateCategoryDialog({
  open,
  onOpenChange,
  summaries,
  selectedLearningLanguage,
  onLearningLanguageChange,
  categoryName,
  onCategoryNameChange,
  busy,
  error,
  onSubmit,
  onCancel,
}: CreateCategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create category</DialogTitle>
          <DialogDescription>
            Categories help you organise words for a specific learning language, such as topics or
            themes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label
              className="text-foreground text-sm font-medium"
              htmlFor="category-language-select"
            >
              Learning language
            </label>
            <Select
              value={selectedLearningLanguage || undefined}
              onValueChange={onLearningLanguageChange}
              disabled={busy || summaries.length === 0}
            >
              <SelectTrigger id="category-language-select" className="h-9 w-full px-3 text-sm">
                <SelectValue placeholder="Select learning language" />
              </SelectTrigger>
              <SelectContent>
                {summaries.map(summary => (
                  <SelectItem key={summary.id} value={summary.id}>
                    {summary.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-foreground text-sm font-medium" htmlFor="category-name-input">
              Category name
            </label>
            <Input
              id="category-name-input"
              placeholder="e.g. Travel essentials"
              value={categoryName}
              onChange={event => onCategoryNameChange(event.target.value)}
              disabled={busy}
            />
          </div>

          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void onSubmit()}
            disabled={busy || summaries.length === 0}
          >
            {busy ? 'Creating…' : 'Create category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type DeleteLearningLanguageDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  languageName: string
  busy: boolean
  error: string | null
  onConfirm: () => Promise<void> | void
  onCancel: () => void
}

function DeleteLearningLanguageDialog({
  open,
  onOpenChange,
  languageName,
  busy,
  error,
  onConfirm,
  onCancel,
}: DeleteLearningLanguageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-test-id="delete-learning-language-dialog">
        <DialogHeader>
          <DialogTitle>Delete learning language</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{languageName}</strong>? This will permanently
            remove all categories and words associated with this language.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
            {error}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={busy}
            data-test-id="dialog-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void onConfirm()}
            disabled={busy}
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            data-test-id="dialog-confirm-delete"
          >
            {busy ? 'Deleting…' : 'Delete language'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
