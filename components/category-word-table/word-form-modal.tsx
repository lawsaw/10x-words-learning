"use client"

import { useEffect, useMemo, useState } from "react"

import { AiLoaderOverlay } from "@/components/category-word-table/ai-loader-overlay"
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
import type {
  CreateWordCommand,
  DifficultyLevel,
  GeneratedWordSuggestionDto,
  UpdateWordCommand,
  WordFormState,
} from "@/lib/types"

type WordFormModalProps = {
  open: boolean
  mode: "create" | "edit"
  initialValue?: WordFormState
  onClose: () => void
  onSubmit: (
    payload: CreateWordCommand | UpdateWordCommand,
    wordId?: string,
  ) => Promise<void>
  onAiGenerate: (
    difficulty: DifficultyLevel,
  ) => Promise<GeneratedWordSuggestionDto | null>
  busy: boolean
  aiBusy: boolean
}

type FieldErrors = {
  term?: string
  translation?: string
  examplesMd?: string
}

const MIN_EXAMPLES_LENGTH = 1
const MAX_TERM_LENGTH = 500
const MAX_TRANSLATION_LENGTH = 500
const MAX_EXAMPLES_LENGTH = 2000

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: "Easy",
  medium: "Medium",
  advanced: "Advanced",
}

export function WordFormModal({
  open,
  mode,
  initialValue,
  onClose,
  onSubmit,
  onAiGenerate,
  busy,
  aiBusy,
}: WordFormModalProps) {
  const [term, setTerm] = useState<string>(initialValue?.term ?? "")
  const [translation, setTranslation] = useState<string>(initialValue?.translation ?? "")
  const [examplesMd, setExamplesMd] = useState<string>(initialValue?.examplesMd ?? "")
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialValue?.difficulty ?? "medium")
  const [touched, setTouched] = useState<{ term: boolean; translation: boolean; examplesMd: boolean }>(
    { term: false, translation: false, examplesMd: false },
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setTerm(initialValue?.term ?? "")
    setTranslation(initialValue?.translation ?? "")
    setExamplesMd(initialValue?.examplesMd ?? "")
    setDifficulty(initialValue?.difficulty ?? "medium")
    setTouched({ term: false, translation: false, examplesMd: false })
    setFormError(null)
    setAiError(null)
  }, [open, initialValue])

  const trimmedTerm = term.trim()
  const trimmedTranslation = translation.trim()
  const trimmedExamples = examplesMd.trim()

  const fieldErrors: FieldErrors = useMemo(() => {
    const errors: FieldErrors = {}

    if (!trimmedTerm) {
      errors.term = "Term is required"
    } else if (trimmedTerm.length > MAX_TERM_LENGTH) {
      errors.term = `Term must be ≤${MAX_TERM_LENGTH} characters`
    }

    if (!trimmedTranslation) {
      errors.translation = "Translation is required"
    } else if (trimmedTranslation.length > MAX_TRANSLATION_LENGTH) {
      errors.translation = `Translation must be ≤${MAX_TRANSLATION_LENGTH} characters`
    }

    if (!trimmedExamples || trimmedExamples.length < MIN_EXAMPLES_LENGTH) {
      errors.examplesMd = "Examples are required"
    } else if (trimmedExamples.length > MAX_EXAMPLES_LENGTH) {
      errors.examplesMd = `Examples must be ≤${MAX_EXAMPLES_LENGTH} characters`
    }

    return errors
  }, [trimmedTerm, trimmedTranslation, trimmedExamples])

  const isValid = Object.keys(fieldErrors).length === 0
  const saveDisabled = !isValid || busy || aiBusy

  const handleGenerate = async () => {
    setAiError(null)
    const suggestion = await onAiGenerate(difficulty)

    if (!suggestion) {
      setAiError("Unable to generate a suggestion. Please try again.")
      return
    }

    setTerm(suggestion.term)
    setTranslation(suggestion.translation)
    setExamplesMd(suggestion.examplesMd)
  }

  const handleSubmit = async () => {
    if (!isValid || busy || aiBusy) {
      setTouched({ term: true, translation: true, examplesMd: true })
      return
    }

    setFormError(null)

    const payload: CreateWordCommand | UpdateWordCommand = {
      term: trimmedTerm,
      translation: trimmedTranslation,
      examplesMd: trimmedExamples,
    }

    try {
      await onSubmit(payload, initialValue?.wordId)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save word."
      setFormError(message)
    }
  }

  const showTermError = touched.term && fieldErrors.term
  const showTranslationError = touched.translation && fieldErrors.translation
  const showExamplesError = touched.examplesMd && fieldErrors.examplesMd

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create word" : "Edit word"}</DialogTitle>
          <DialogDescription>
            Provide the vocabulary details and examples. All fields are required to save changes.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <AiLoaderOverlay visible={aiBusy} message="Generating suggestion…" />

          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              handleSubmit()
            }}
          >
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="word-term">
                Term
              </label>
              <Input
                id="word-term"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, term: true }))}
                placeholder="Enter the word or phrase"
                disabled={busy || aiBusy}
              />
              {showTermError ? (
                <p className="text-xs text-destructive">{fieldErrors.term}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="word-translation">
                Translation
              </label>
              <Input
                id="word-translation"
                value={translation}
                onChange={(event) => setTranslation(event.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, translation: true }))}
                placeholder="Provide the translation"
                disabled={busy || aiBusy}
              />
              {showTranslationError ? (
                <p className="text-xs text-destructive">{fieldErrors.translation}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="word-examples">
                Examples (Markdown supported)
              </label>
              <textarea
                id="word-examples"
                value={examplesMd}
                onChange={(event) => setExamplesMd(event.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, examplesMd: true }))}
                placeholder="Provide example sentences or phrases in Markdown."
                className="min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={busy || aiBusy}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Minimum 1 character. Markdown will be rendered in the table.</span>
                <span>
                  {trimmedExamples.length}/{MAX_EXAMPLES_LENGTH}
                </span>
              </div>
              {showExamplesError ? (
                <p className="text-xs text-destructive">{fieldErrors.examplesMd}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="word-difficulty">
                Difficulty
              </label>
              <select
                id="word-difficulty"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as DifficultyLevel)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={busy || aiBusy}
              >
                {(Object.keys(DIFFICULTY_LABELS) as DifficultyLevel[]).map((key) => (
                  <option key={key} value={key}>
                    {DIFFICULTY_LABELS[key]}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Difficulty guides AI generation and helps contextualise your study sessions.
              </p>
            </div>

            {aiError ? <p className="text-xs text-destructive">{aiError}</p> : null}
            {formError ? <p className="text-xs text-destructive">{formError}</p> : null}
          </form>
        </div>

        <DialogFooter className="gap-2">
          <div className="flex flex-1 items-center gap-2 sm:justify-start">
            <Button type="button" variant="outline" size="sm" onClick={handleGenerate} disabled={aiBusy}>
              Generate with AI
            </Button>
          </div>
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy || aiBusy}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saveDisabled}>
            {mode === "create" ? "Save word" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


