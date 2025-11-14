"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import type { AuthModalKey, SupportedLanguagesVm } from "@/app/(public)/types"
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

type RegisterModalProps = {
  open: boolean
  onClose: () => void
  onSwitch: (next: AuthModalKey) => void
  initialLanguages: SupportedLanguagesVm
}

type RegisterFormState = {
  email: string
  password: string
  userLanguage: string
  status: "idle" | "submitting" | "success"
  error: string | null
}

type LanguagesState = {
  data: SupportedLanguagesVm | null
  status: "idle" | "loading" | "error" | "success"
  error: string | null
}

const INITIAL_FORM_STATE: RegisterFormState = {
  email: "",
  password: "",
  userLanguage: "",
  status: "idle",
  error: null,
}

const INITIAL_LANGUAGES_STATE: LanguagesState = {
  data: null,
  status: "idle",
  error: null,
}

const PASSWORD_MIN_LENGTH = 5

export function RegisterModal({
  open,
  onClose,
  onSwitch,
  initialLanguages,
}: RegisterModalProps) {
  const [formState, setFormState] =
    useState<RegisterFormState>(INITIAL_FORM_STATE)
  const [languagesState, setLanguagesState] = useState<LanguagesState>(() => {
    if (initialLanguages.items.length > 0) {
      return {
        data: initialLanguages,
        status: "success",
        error: null,
      }
    }

    return INITIAL_LANGUAGES_STATE
  })

  const { email, password, userLanguage, status, error } = formState
  const languages = languagesState.data ?? initialLanguages
  const isLanguagesLoading = languagesState.status === "loading"
  const isLanguagesError = languagesState.status === "error"

  useEffect(() => {
    if (!open) {
      return
    }

    setFormState(INITIAL_FORM_STATE)
    if (languagesState.status === "idle") {
      void fetchLanguages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const fetchLanguages = useCallback(async () => {
    setLanguagesState({
      data: languagesState.data,
      status: "loading",
      error: null,
    })

    try {
      const response = await fetch(
        "/api/languages?scope=registration",
        {
          method: "GET",
          credentials: "include",
        },
      )

      if (!response.ok) {
        throw new Error("Failed to load languages")
      }

      const payload = (await response.json()) as {
        languages: Array<{ code: string; name: string }>
      }

      const nextLanguages: SupportedLanguagesVm = {
        items: payload.languages.map((language) => ({
          code: language.code,
          label: language.name,
        })),
      }

      setLanguagesState({
        data: nextLanguages,
        status: "success",
        error: null,
      })
    } catch (fetchError) {
      setLanguagesState({
        data: languagesState.data,
        status: "error",
        error:
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load languages. Please try again.",
      })
    }
  }, [languagesState.data])

  const handleFieldChange = useCallback(
    (field: "email" | "password" | "userLanguage") =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = event.target.value
        setFormState((previous) => ({
          ...previous,
          [field]: value,
          error: null,
        }))
      },
    [],
  )

  const canSubmit = useMemo(() => {
    const isEmailValid = email.trim().length > 0
    const isPasswordValid = password.trim().length >= PASSWORD_MIN_LENGTH
    const isLanguageSelected = userLanguage.trim().length > 0
    return (
      isEmailValid &&
      isPasswordValid &&
      isLanguageSelected &&
      !isLanguagesLoading
    )
  }, [email, password, userLanguage, isLanguagesLoading])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!canSubmit || status === "submitting") {
        return
      }

      setFormState((previous) => ({
        ...previous,
        status: "submitting",
        error: null,
      }))

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email,
            password,
            userLanguage,
          }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          const message =
            payload?.error?.message ??
            "We couldn’t complete registration. Please try again."

          setFormState((previous) => ({
            ...previous,
            status: "idle",
            error: message,
          }))
          return
        }

        setFormState((previous) => ({
          ...previous,
          status: "success",
        }))
        onClose()
        window.location.replace("/app")
      } catch {
        setFormState((previous) => ({
          ...previous,
          status: "idle",
          error: "Something went wrong. Please try again.",
        }))
      }
    },
    [canSubmit, email, password, status, userLanguage, onClose],
  )

  const handleSwitchToLogin = useCallback(() => {
    onSwitch("login")
  }, [onSwitch])

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create your account</DialogTitle>
          <DialogDescription>
            Start gathering thematic word lists, track AI suggestions, and keep
            every learning language organised in one place.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <label htmlFor="register-email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={handleFieldChange("email")}
              placeholder="you@example.com"
              required
              disabled={status === "submitting"}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="register-password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <span className="text-xs text-muted-foreground">
                Minimum {PASSWORD_MIN_LENGTH} characters
              </span>
            </div>
            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={handleFieldChange("password")}
              placeholder="Create a secure password"
              minLength={PASSWORD_MIN_LENGTH}
              required
              disabled={status === "submitting"}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="register-language"
                className="text-sm font-medium text-foreground"
              >
                Your language
              </label>
              <span className="text-xs text-muted-foreground">
                Guides translations and AI prompts
              </span>
            </div>

            {isLanguagesLoading ? (
              <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
            ) : (
              <select
                id="register-language"
                value={userLanguage}
                onChange={handleFieldChange("userLanguage")}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={status === "submitting"}
                required
              >
                <option value="">Select your language</option>
                {languages.items.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            )}

            {isLanguagesError ? (
              <div className="flex flex-col gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {languagesState.error ??
                    "Unable to load languages. Please try again."}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={fetchLanguages}
                  disabled={status === "submitting"}
                >
                  Retry
                </Button>
              </div>
            ) : null}

            {!isLanguagesLoading &&
            !isLanguagesError &&
            !languages.items.length ? (
              <p className="text-xs text-muted-foreground">
                Language options are updating. You can refresh or try again
                shortly.
              </p>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={!canSubmit || status === "submitting"}
          >
            {status === "submitting"
              ? "Creating your workspace..."
              : "Create account"}
          </Button>
        </form>

        <DialogFooter className="mt-4 text-sm text-muted-foreground">
          <span>Already have an account?</span>
          <button
            type="button"
            className="font-medium text-primary underline-offset-2 hover:underline"
            onClick={handleSwitchToLogin}
            disabled={status === "submitting"}
          >
            Log in instead
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

