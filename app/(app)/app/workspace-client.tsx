"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export type LearningLanguageSummary = {
  id: string
  code: string
  name: string
  categories: Array<{ id: string; name: string; wordCount: number }>
}

type WorkspaceClientProps = {
  initialSummaries: LearningLanguageSummary[]
}

type FeedbackType = "success" | "error"

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
    () => initialSummaries.filter((summary) => Boolean(summary.id)),
    [initialSummaries],
  )

  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [createLanguageOpen, setCreateLanguageOpen] = useState(false)
  const [createLanguageBusy, setCreateLanguageBusy] = useState(false)
  const [languageOptions, setLanguageOptions] = useState<LanguageOption[]>([])
  const [languageOptionsLoading, setLanguageOptionsLoading] = useState(false)
  const [languageOptionsError, setLanguageOptionsError] = useState<string | null>(null)
  const [selectedLanguageCode, setSelectedLanguageCode] = useState("")
  const [createLanguageError, setCreateLanguageError] = useState<string | null>(null)

  const [createCategoryOpen, setCreateCategoryOpen] = useState(false)
  const [createCategoryBusy, setCreateCategoryBusy] = useState(false)
  const [selectedCategoryLanguage, setSelectedCategoryLanguage] = useState<string>(
    summaries[0]?.id ?? "",
  )
  const [categoryName, setCategoryName] = useState("")
  const [createCategoryError, setCreateCategoryError] = useState<string | null>(null)

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
      const response = await fetch("/api/languages?scope=learning", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload?.error?.message ?? "Unable to fetch languages."
        throw new Error(message)
      }

      const payload = (await response.json()) as LanguagesListDto
      const options = payload.languages ?? []
      setLanguageOptions(options)
      if (options.length > 0) {
        setSelectedLanguageCode((current) => current || options[0].code)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load languages."
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
    setSelectedLanguageCode(languageOptions[0]?.code ?? "")
    setCreateLanguageError(null)
  }

  const resetCategoryForm = (targetLanguageId?: string) => {
    setSelectedCategoryLanguage(targetLanguageId ?? summaries[0]?.id ?? "")
    setCategoryName("")
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

  const handleCreateLanguage = async () => {
    const languageId = selectedLanguageCode.trim()
    if (!languageId) {
      setCreateLanguageError("Select a learning language to add.")
      return
    }

    setCreateLanguageBusy(true)
    setCreateLanguageError(null)
    try {
      const response = await fetch("/api/learning-languages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ languageId }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload?.error?.message ?? "Failed to create learning language."
        throw new Error(message)
      }

      closeLanguageDialog()
      showFeedback("success", "Learning language added successfully.")
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create learning language."
      setCreateLanguageError(message)
    } finally {
      setCreateLanguageBusy(false)
    }
  }

  const handleCreateCategory = async () => {
    const trimmedName = categoryName.trim()
    if (!selectedCategoryLanguage) {
      setCreateCategoryError("Select a learning language.")
      return
    }
    if (!trimmedName) {
      setCreateCategoryError("Category name is required.")
      return
    }

    setCreateCategoryBusy(true)
    setCreateCategoryError(null)
    try {
      const response = await fetch(
        `/api/learning-languages/${selectedCategoryLanguage}/categories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: trimmedName }),
        },
      )

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload?.error?.message ?? "Failed to create category."
        throw new Error(message)
      }

      const payload = (await response.json()) as { id: string }
      closeCategoryDialog()
      showFeedback("success", "Category created successfully.")
      if (payload?.id) {
        router.push(`/app/${selectedCategoryLanguage}/${payload.id}`)
      } else {
        router.refresh()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create category."
      setCreateCategoryError(message)
    } finally {
      setCreateCategoryBusy(false)
    }
  }

  const handleOpenCategoryDialog = useCallback(
    (learningLanguageId?: string) => {
      const targetId = learningLanguageId ?? summaries[0]?.id ?? ""
      resetCategoryForm(targetId)
      setCreateCategoryOpen(true)
    },
    [summaries],
  )

  const handleOpenLanguageDialog = () => {
    resetLanguageForm()
    setCreateLanguageOpen(true)
  }

  return (
    <div className="space-y-8">
      {feedback ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
          role="status"
          aria-live="polite"
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm">
          <h2 className="text-base font-semibold text-foreground">Workspace overview</h2>
          <p className="text-muted-foreground">
            Manage learning languages and their categories. Use the buttons to add new items and then dive into the
            table view.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" onClick={handleOpenLanguageDialog}>
            Add learning language
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenCategoryDialog()}
            disabled={!hasLearningLanguages}
          >
            Add category
          </Button>
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-foreground">No learning languages yet</h3>
            <p className="text-sm text-muted-foreground">
              Add your first learning language to start creating categories and studying new words.
            </p>
          </div>
          <Button type="button" onClick={handleOpenLanguageDialog}>
            Add learning language
          </Button>
        </div>
      ) : (
        <LanguageList summaries={summaries} onCreateCategory={handleOpenCategoryDialog} />
      )}

      <CreateLearningLanguageDialog
        open={createLanguageOpen}
        onOpenChange={(next) => {
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
        onOpenChange={(next) => {
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
    </div>
  )
}

type LanguageListProps = {
  summaries: LearningLanguageSummary[]
  onCreateCategory: (learningLanguageId: string) => void
}

function LanguageList({ summaries, onCreateCategory }: LanguageListProps) {
  return (
    <div className="space-y-8">
      {summaries.map((summary) => (
        <section
          key={summary.id}
          className="space-y-3 rounded-lg border border-border bg-white p-4 shadow-sm"
        >
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {summary.name} <span className="text-sm text-muted-foreground">({summary.code})</span>
              </h3>
              {summary.categories.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No categories yet. Create one to populate this learning language.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {summary.categories.length} categor{summary.categories.length === 1 ? "y" : "ies"} available.
                </p>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => onCreateCategory(summary.id)}>
              Add category
            </Button>
          </header>

          {summary.categories.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {summary.categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/app/${summary.id}/${category.id}`}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 transition hover:border-foreground hover:bg-muted/50"
                  >
                    <span className="text-sm font-medium text-foreground">{category.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {category.wordCount} word{category.wordCount === 1 ? "" : "s"}
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add learning language</DialogTitle>
          <DialogDescription>
            Select a language you would like to study. Each learning language can contain multiple categories.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {optionsLoading ? (
            <p className="text-sm text-muted-foreground">Loading languages…</p>
          ) : optionsError ? (
            <div className="space-y-2 text-sm text-destructive">
              <p>{optionsError}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void onRetryLoad()}>
                Retry
              </Button>
            </div>
          ) : options.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No additional languages are available right now.
            </p>
          ) : (
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="learning-language-select">
                Learning language
              </label>
              <select
                id="learning-language-select"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedLanguageCode}
                onChange={(event) => onSelectedLanguageChange(event.target.value)}
                disabled={busy}
              >
                {options.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name} ({option.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void onSubmit()} disabled={busy || options.length === 0}>
            {busy ? "Adding…" : "Add language"}
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
            Categories help you organise words for a specific learning language, such as topics or themes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="category-language-select">
              Learning language
            </label>
            <select
              id="category-language-select"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={selectedLearningLanguage}
              onChange={(event) => onLearningLanguageChange(event.target.value)}
              disabled={busy || summaries.length === 0}
            >
              {summaries.map((summary) => (
                <option key={summary.id} value={summary.id}>
                  {summary.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="category-name-input">
              Category name
            </label>
            <Input
              id="category-name-input"
              placeholder="e.g. Travel essentials"
              value={categoryName}
              onChange={(event) => onCategoryNameChange(event.target.value)}
              disabled={busy}
            />
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}
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
            {busy ? "Creating…" : "Create category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
