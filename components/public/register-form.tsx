'use client'

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import type { SupportedLanguagesVm } from '@/app/(public)/types'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type RegisterFormProps = {
  initialLanguages: SupportedLanguagesVm
  className?: string
  footer?: React.ReactNode
  submitLabel?: string
  submittingLabel?: string
  onSuccess?: () => void
}

type RegisterFormState = {
  email: string
  password: string
  confirmPassword: string
  userLanguage: string
  status: 'idle' | 'submitting' | 'success'
  error: string | null
}

type LanguagesState = {
  data: SupportedLanguagesVm | null
  status: 'idle' | 'loading' | 'error' | 'success'
  error: string | null
}

const INITIAL_FORM_STATE: RegisterFormState = {
  email: '',
  password: '',
  confirmPassword: '',
  userLanguage: '',
  status: 'idle',
  error: null,
}

const INITIAL_LANGUAGES_STATE: LanguagesState = {
  data: null,
  status: 'idle',
  error: null,
}

const PASSWORD_MIN_LENGTH = 6

export function RegisterForm({
  initialLanguages,
  className,
  footer,
  submitLabel = 'Create account',
  submittingLabel = 'Creating your workspace...',
  onSuccess,
}: RegisterFormProps) {
  const router = useRouter()
  const [formState, setFormState] = useState<RegisterFormState>(INITIAL_FORM_STATE)
  const [languagesState, setLanguagesState] = useState<LanguagesState>(() => {
    if (initialLanguages.items.length > 0) {
      return {
        data: initialLanguages,
        status: 'success',
        error: null,
      }
    }

    return INITIAL_LANGUAGES_STATE
  })

  const { email, password, confirmPassword, userLanguage, status, error } = formState
  const languages = languagesState.data ?? initialLanguages
  const isLanguagesLoading = languagesState.status === 'loading'
  const isLanguagesError = languagesState.status === 'error'
  const passwordsMatch = password === confirmPassword

  const fetchLanguages = useCallback(async () => {
    setLanguagesState(previous => ({
      data: previous.data,
      status: 'loading',
      error: null,
    }))

    try {
      const response = await fetch('/api/languages?scope=registration', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to load languages')
      }

      const payload = (await response.json()) as {
        languages: Array<{ code: string; name: string }>
      }

      const nextLanguages: SupportedLanguagesVm = {
        items: payload.languages.map(language => ({
          code: language.code,
          label: language.name,
        })),
      }

      setLanguagesState({
        data: nextLanguages,
        status: 'success',
        error: null,
      })
    } catch (fetchError) {
      setLanguagesState(previous => ({
        data: previous.data,
        status: 'error',
        error:
          fetchError instanceof Error
            ? fetchError.message
            : 'Unable to load languages. Please try again.',
      }))
    }
  }, [])

  useEffect(() => {
    if (languagesState.status === 'idle') {
      void fetchLanguages()
    }
  }, [fetchLanguages, languagesState.status])

  const handleFieldChange = useCallback(
    (field: 'email' | 'password' | 'confirmPassword') => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value
      setFormState(previous => ({
        ...previous,
        [field]: value,
        error: null,
      }))
    },
    []
  )

  const handleLanguageSelect = useCallback((value: string) => {
    setFormState(previous => ({
      ...previous,
      userLanguage: value,
      error: null,
    }))
  }, [])

  const handleSuccess = useCallback(() => {
    onSuccess?.()
    router.push('/app')
  }, [onSuccess, router])

  const canSubmit = useMemo(() => {
    const isEmailValid = email.trim().length > 0
    const isPasswordValid = password.trim().length >= PASSWORD_MIN_LENGTH
    const isLanguageSelected = userLanguage.trim().length > 0

    return (
      isEmailValid && isPasswordValid && isLanguageSelected && passwordsMatch && !isLanguagesLoading
    )
  }, [email, password, userLanguage, isLanguagesLoading, passwordsMatch])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!canSubmit || status === 'submitting') {
        return
      }

      setFormState(previous => ({
        ...previous,
        status: 'submitting',
        error: null,
      }))

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email,
            password,
            userLanguage,
          }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          const message =
            payload?.error?.message ?? 'We couldn’t complete registration. Please try again.'

          setFormState(previous => ({
            ...previous,
            status: 'idle',
            error: message,
          }))
          return
        }

        setFormState(previous => ({
          ...previous,
          status: 'success',
        }))
        handleSuccess()
      } catch {
        setFormState(previous => ({
          ...previous,
          status: 'idle',
          error: 'Something went wrong. Please try again.',
        }))
      }
    },
    [canSubmit, email, password, status, userLanguage, handleSuccess]
  )

  return (
    <div className={cn('space-y-4', className)}>
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-2">
          <label htmlFor="register-email" className="text-foreground text-sm font-medium">
            Email
          </label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={handleFieldChange('email')}
            placeholder="you@example.com"
            required
            disabled={status === 'submitting'}
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="register-password" className="text-foreground text-sm font-medium">
              Password
            </label>
            <span className="text-muted-foreground text-xs">
              Minimum {PASSWORD_MIN_LENGTH} characters
            </span>
          </div>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={handleFieldChange('password')}
            placeholder="Create a secure password"
            minLength={PASSWORD_MIN_LENGTH}
            required
            disabled={status === 'submitting'}
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="register-confirm-password"
            className="text-foreground text-sm font-medium"
          >
            Confirm password
          </label>
          <Input
            id="register-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={handleFieldChange('confirmPassword')}
            placeholder="Repeat your password"
            minLength={PASSWORD_MIN_LENGTH}
            required
            disabled={status === 'submitting'}
          />
          {!passwordsMatch && confirmPassword.length > 0 ? (
            <p className="text-destructive text-xs">Passwords must match.</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="register-language" className="text-foreground text-sm font-medium">
              Your language
            </label>
            <span className="text-muted-foreground text-xs">
              Guides translations and AI prompts
            </span>
          </div>

          {isLanguagesLoading ? (
            <div className="bg-muted h-10 w-full animate-pulse rounded-md" />
          ) : (
            <Select
              value={userLanguage || undefined}
              onValueChange={handleLanguageSelect}
              disabled={status === 'submitting'}
            >
              <SelectTrigger id="register-language" className="h-10 w-full">
                <SelectValue placeholder="Select your language" />
              </SelectTrigger>
              <SelectContent>
                {languages.items.map(item => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {isLanguagesError ? (
            <div className="border-destructive/40 bg-destructive/10 text-destructive flex flex-col gap-2 rounded-md border px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
              <span>{languagesState.error ?? 'Unable to load languages. Please try again.'}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={fetchLanguages}
                disabled={status === 'submitting'}
              >
                Retry
              </Button>
            </div>
          ) : null}

          {!isLanguagesLoading && !isLanguagesError && !languages.items.length ? (
            <p className="text-muted-foreground text-xs">
              Language options are updating. You can refresh or try again shortly.
            </p>
          ) : null}
        </div>

        {error ? (
          <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
            {error}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={!canSubmit || status === 'submitting'}>
          {status === 'submitting' ? submittingLabel : submitLabel}
        </Button>
      </form>

      {footer}
    </div>
  )
}
