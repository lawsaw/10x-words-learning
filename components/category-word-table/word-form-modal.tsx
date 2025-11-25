'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { AiLoaderOverlay } from '@/components/category-word-table/ai-loader-overlay'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  CreateWordCommand,
  DifficultyLevel,
  GeneratedWordSuggestionDto,
  UpdateWordCommand,
  WordFormState,
} from '@/lib/types'

type WordFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initialValue?: WordFormState
  onClose: () => void
  onSubmit: (payload: CreateWordCommand | UpdateWordCommand, wordId?: string) => Promise<void>
  onAiGenerate: (difficulty: DifficultyLevel) => Promise<GeneratedWordSuggestionDto | null>
  busy: boolean
  aiBusy: boolean
}

type FieldErrors = {
  term?: string
  translation?: string
  transcription?: string
  examplesMd?: string
}

const MIN_EXAMPLES_LENGTH = 1
const MAX_TERM_LENGTH = 500
const MAX_TRANSLATION_LENGTH = 500
const MAX_TRANSCRIPTION_LENGTH = 500
const MAX_EXAMPLES_LENGTH = 3000

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: 'Easy',
  medium: 'Medium',
  advanced: 'Advanced',
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
  const [term, setTerm] = useState<string>(initialValue?.term ?? '')
  const [translation, setTranslation] = useState<string>(initialValue?.translation ?? '')
  const [transcription, setTranscription] = useState<string>(initialValue?.transcription ?? '')
  const [examplesMd, setExamplesMd] = useState<string>(initialValue?.examplesMd ?? '')
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    initialValue?.difficulty ?? 'medium'
  )
  const [touched, setTouched] = useState<{
    term: boolean
    translation: boolean
    transcription: boolean
    examplesMd: boolean
  }>({ term: false, translation: false, transcription: false, examplesMd: false })
  const [formError, setFormError] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  const resetFormValues = useCallback((value?: WordFormState) => {
    setTerm(value?.term ?? '')
    setTranslation(value?.translation ?? '')
    setTranscription(value?.transcription ?? '')
    setExamplesMd(value?.examplesMd ?? '')
    setDifficulty(value?.difficulty ?? 'medium')
    setTouched({ term: false, translation: false, transcription: false, examplesMd: false })
    setFormError(null)
    setAiError(null)
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      resetFormValues(initialValue)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [open, initialValue, resetFormValues])

  const trimmedTerm = term.trim()
  const trimmedTranslation = translation.trim()
  const trimmedTranscription = transcription.trim()
  const trimmedExamples = examplesMd.trim()

  const fieldErrors: FieldErrors = useMemo(() => {
    const errors: FieldErrors = {}

    if (!trimmedTerm) {
      errors.term = 'Term is required'
    } else if (trimmedTerm.length > MAX_TERM_LENGTH) {
      errors.term = `Term must be ≤${MAX_TERM_LENGTH} characters`
    }

    if (!trimmedTranslation) {
      errors.translation = 'Translation is required'
    } else if (trimmedTranslation.length > MAX_TRANSLATION_LENGTH) {
      errors.translation = `Translation must be ≤${MAX_TRANSLATION_LENGTH} characters`
    }

    if (trimmedTranscription.length > MAX_TRANSCRIPTION_LENGTH) {
      errors.transcription = `Transcription must be ≤${MAX_TRANSCRIPTION_LENGTH} characters`
    }

    if (!trimmedExamples || trimmedExamples.length < MIN_EXAMPLES_LENGTH) {
      errors.examplesMd = 'Examples are required'
    } else if (trimmedExamples.length > MAX_EXAMPLES_LENGTH) {
      errors.examplesMd = `Examples must be ≤${MAX_EXAMPLES_LENGTH} characters`
    }

    return errors
  }, [trimmedTerm, trimmedTranslation, trimmedTranscription, trimmedExamples])

  const isValid = Object.keys(fieldErrors).length === 0
  const saveDisabled = !isValid || busy || aiBusy

  const handleGenerate = async () => {
    setAiError(null)
    const suggestion = await onAiGenerate(difficulty)

    if (!suggestion) {
      setAiError('Unable to generate a suggestion. Please try again.')
      return
    }

    setTerm(suggestion.term)
    setTranslation(suggestion.translation)
    setTranscription(suggestion.transcription || '')
    setExamplesMd(suggestion.examplesMd)
  }

  const handleSubmit = async () => {
    if (!isValid || busy || aiBusy) {
      setTouched({ term: true, translation: true, transcription: true, examplesMd: true })
      return
    }

    setFormError(null)

    const payload: CreateWordCommand | UpdateWordCommand = {
      term: trimmedTerm,
      translation: trimmedTranslation,
      transcription: trimmedTranscription || undefined,
      examplesMd: trimmedExamples,
    }

    try {
      await onSubmit(payload, initialValue?.wordId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save word.'
      setFormError(message)
    }
  }

  const showTermError = touched.term && fieldErrors.term
  const showTranslationError = touched.translation && fieldErrors.translation
  const showTranscriptionError = touched.transcription && fieldErrors.transcription
  const showExamplesError = touched.examplesMd && fieldErrors.examplesMd

  return (
    <Dialog open={open} onOpenChange={next => (!next ? onClose() : undefined)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create word' : 'Edit word'}</DialogTitle>
          <DialogDescription>Provide the vocabulary details and examples</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <AiLoaderOverlay visible={aiBusy} message="Generating suggestion…" />

          <form
            className="grid gap-4"
            onSubmit={event => {
              event.preventDefault()
              handleSubmit()
            }}
          >
            <div className="grid gap-2">
              <label className="text-foreground text-sm font-medium" htmlFor="word-term">
                Term
              </label>
              <Input
                id="word-term"
                value={term}
                onChange={event => setTerm(event.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, term: true }))}
                placeholder="Enter the word or phrase"
                disabled={busy || aiBusy}
              />
              {showTermError ? (
                <p className="text-destructive text-xs">{fieldErrors.term}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label className="text-foreground text-sm font-medium" htmlFor="word-translation">
                Translation
              </label>
              <Input
                id="word-translation"
                value={translation}
                onChange={event => setTranslation(event.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, translation: true }))}
                placeholder="Provide the translation"
                disabled={busy || aiBusy}
              />
              {showTranslationError ? (
                <p className="text-destructive text-xs">{fieldErrors.translation}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label className="text-foreground text-sm font-medium" htmlFor="word-transcription">
                Transcription <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                id="word-transcription"
                value={transcription}
                onChange={event => setTranscription(event.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, transcription: true }))}
                placeholder="Phonetic transcription in your native alphabet"
                disabled={busy || aiBusy}
              />
              {showTranscriptionError ? (
                <p className="text-destructive text-xs">{fieldErrors.transcription}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label className="text-foreground text-sm font-medium" htmlFor="word-examples">
                Examples
              </label>
              <textarea
                id="word-examples"
                value={examplesMd}
                onChange={event => setExamplesMd(event.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, examplesMd: true }))}
                placeholder="Provide example sentences or phrases in Markdown."
                className="border-input bg-background text-foreground focus-visible:ring-ring min-h-[120px] w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[160px]"
                disabled={busy || aiBusy}
              />
              <div className="text-muted-foreground flex items-center justify-end text-xs">
                <span className="shrink-0">
                  {trimmedExamples.length}/{MAX_EXAMPLES_LENGTH}
                </span>
              </div>
              {showExamplesError ? (
                <p className="text-destructive text-xs">{fieldErrors.examplesMd}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label className="text-foreground text-sm font-medium" htmlFor="word-difficulty">
                Difficulty
              </label>
              <Select
                value={difficulty}
                onValueChange={value => setDifficulty(value as DifficultyLevel)}
                disabled={busy || aiBusy}
              >
                <SelectTrigger id="word-difficulty" className="h-9 w-full px-3 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(DIFFICULTY_LABELS) as DifficultyLevel[]).map(key => (
                    <SelectItem key={key} value={key}>
                      {DIFFICULTY_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Difficulty guides AI generation and helps contextualise your study sessions.
              </p>
            </div>

            {aiError ? <p className="text-destructive text-xs">{aiError}</p> : null}
            {formError ? <p className="text-destructive text-xs">{formError}</p> : null}
          </form>
        </div>

        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleGenerate}
            disabled={aiBusy}
            className="flex w-full items-center justify-center gap-2 rounded-md border-transparent bg-gradient-to-r from-indigo-500 to-sky-500 px-4 py-2 text-base font-semibold !text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-sky-600 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto sm:px-5 sm:text-sm"
          >
            <span aria-hidden>✨</span>
            <span>Generate with AI</span>
          </Button>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={busy || aiBusy}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={saveDisabled}
              className="flex-1 sm:flex-none"
            >
              {mode === 'create' ? 'Save word' : 'Save changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
