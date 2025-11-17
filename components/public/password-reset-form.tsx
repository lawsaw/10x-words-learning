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

type PasswordResetFormProps = {
  token: string
  className?: string
  passwordMinLength?: number
}

type ResetFormState = {
  password: string
  confirmPassword: string
  status: "idle" | "submitting" | "success"
  error: string | null
}

const DEFAULT_MIN_LENGTH = 5

const INITIAL_STATE: ResetFormState = {
  password: "",
  confirmPassword: "",
  status: "idle",
  error: null,
}

export function PasswordResetForm({
  token,
  className,
  passwordMinLength = DEFAULT_MIN_LENGTH,
}: PasswordResetFormProps) {
  const [formState, setFormState] = useState<ResetFormState>(INITIAL_STATE)
  const { password, confirmPassword, status, error } = formState

  const passwordsMatch = password === confirmPassword
  const meetsLength = password.trim().length >= passwordMinLength

  const canSubmit = useMemo(() => {
    return passwordsMatch && meetsLength && password.trim().length > 0
  }, [meetsLength, password, passwordsMatch])

  const handleFieldChange = useCallback(
    (field: "password" | "confirmPassword") =>
      (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value
        setFormState((previous) => ({
          ...previous,
          [field]: value,
          error: null,
        }))
      },
    [],
  )

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
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            token,
            password,
          }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          const message =
            payload?.error?.message ??
            "We couldn’t reset your password. Please request a new link."

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
      } catch {
        setFormState((previous) => ({
          ...previous,
          status: "idle",
          error: "Something went wrong. Please try again.",
        }))
      }
    },
    [canSubmit, status, token, password],
  )

  return (
    <div className={cn("space-y-4", className)}>
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="reset-new-password"
              className="text-sm font-medium text-foreground"
            >
              New password
            </label>
            <span className="text-xs text-muted-foreground">
              Minimum {passwordMinLength} characters
            </span>
          </div>
          <Input
            id="reset-new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={handleFieldChange("password")}
            placeholder="Create a secure password"
            required
            minLength={passwordMinLength}
            disabled={status === "submitting" || status === "success"}
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="reset-confirm-password"
            className="text-sm font-medium text-foreground"
          >
            Confirm password
          </label>
          <Input
            id="reset-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={handleFieldChange("confirmPassword")}
            placeholder="Repeat the new password"
            required
            minLength={passwordMinLength}
            disabled={status === "submitting" || status === "success"}
          />
        </div>

        {!passwordsMatch && confirmPassword.length > 0 ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Passwords must match.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {status === "success" ? (
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
            Your password has been updated. You can close this tab and log back
            in.
          </div>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          disabled={!canSubmit || status === "submitting" || status === "success"}
        >
          {status === "submitting" ? "Updating password..." : "Update password"}
        </Button>
      </form>
    </div>
  )
}


