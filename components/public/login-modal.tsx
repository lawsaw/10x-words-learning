"use client"

import { useCallback, useMemo, useState } from "react"

import type { AuthModalKey } from "@/app/(public)/types"
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

type LoginModalProps = {
  open: boolean
  onClose: () => void
  onSwitch: (next: AuthModalKey) => void
}

type LoginFormState = {
  email: string
  password: string
  error: string | null
  status: "idle" | "submitting" | "success"
}

const INITIAL_FORM_STATE: LoginFormState = {
  email: "",
  password: "",
  error: null,
  status: "idle",
}

export function LoginModal({ open, onClose, onSwitch }: LoginModalProps) {
  const [formState, setFormState] = useState<LoginFormState>(INITIAL_FORM_STATE)
  const { email, password, error, status } = formState

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0
  }, [email, password])

  const handleChange = useCallback(
    (field: "email" | "password") => (event: React.ChangeEvent<HTMLInputElement>) => {
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
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email,
            password,
          }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          const message =
            payload?.error?.message ??
            "Invalid email or password. Please try again."

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
    [canSubmit, email, password, status, onClose],
  )

  const handleSwitchToRegister = useCallback(() => {
    onSwitch("register")
  }, [onSwitch])

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log in to your workspace</DialogTitle>
          <DialogDescription>
            Track categories, AI-generated lists, and review sessions across all
            your learning languages.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-2">
            <label htmlFor="login-email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={handleChange("email")}
              placeholder="you@example.com"
              required
              disabled={status === "submitting"}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="login-password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={handleChange("password")}
              placeholder="••••••••"
              minLength={1}
              required
              disabled={status === "submitting"}
            />
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
            {status === "submitting" ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <DialogFooter className="mt-4 text-sm text-muted-foreground">
          <span>Don&apos;t have an account yet? </span>
          <button
            type="button"
            className="font-medium text-primary underline-offset-2 hover:underline cursor-pointer disabled:cursor-not-allowed"
            onClick={handleSwitchToRegister}
            disabled={status === "submitting"}
          >
            Create one now
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

