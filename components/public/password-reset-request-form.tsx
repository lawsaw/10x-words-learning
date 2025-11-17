"use client"

import {
  useCallback,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type PasswordResetRequestFormProps = {
  className?: string
  onSuccessMessage?: string
}

type RequestFormState = {
  email: string
  status: "idle" | "submitting" | "success"
  error: string | null
}

const INITIAL_STATE: RequestFormState = {
  email: "",
  status: "idle",
  error: null,
}

export function PasswordResetRequestForm({
  className,
  onSuccessMessage = "If an account exists for that email, we sent reset instructions to your inbox.",
}: PasswordResetRequestFormProps) {
  const [formState, setFormState] = useState<RequestFormState>(INITIAL_STATE)
  const { email, status, error } = formState

  const canSubmit = useMemo(() => email.trim().length > 0, [email])

  const handleFieldChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setFormState((previous) => ({
      ...previous,
      email: value,
      error: null,
    }))
  }, [])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
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
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          const message =
            payload?.error?.message ??
            "We couldn’t process your request. Please try again."

          setFormState((previous) => ({
            ...previous,
            status: "idle",
            error: message,
          }))
          return
        }

        setFormState({
          email,
          status: "success",
          error: null,
        })
      } catch {
        setFormState((previous) => ({
          ...previous,
          status: "idle",
          error: "Something went wrong. Please try again.",
        }))
      }
    },
    [canSubmit, email, status],
  )

  return (
    <div className={cn("space-y-4", className)}>
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-2">
          <label
            htmlFor="reset-request-email"
            className="text-sm font-medium text-foreground"
          >
            Email address
          </label>
          <Input
            id="reset-request-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={handleFieldChange}
            placeholder="you@example.com"
            required
            disabled={status === "submitting"}
          />
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {status === "success" ? (
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
            {onSuccessMessage}
          </div>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          disabled={!canSubmit || status === "submitting"}
        >
          {status === "submitting"
            ? "Sending instructions..."
            : "Send reset instructions"}
        </Button>
      </form>
    </div>
  )
}


