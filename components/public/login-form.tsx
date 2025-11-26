'use client'

import { useCallback, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type LoginFormProps = {
  className?: string
  footer?: React.ReactNode
  submitLabel?: string
  submittingLabel?: string
  onSuccess?: () => void
}

type LoginFormState = {
  email: string
  password: string
  error: string | null
  status: 'idle' | 'submitting' | 'success'
}

const INITIAL_FORM_STATE: LoginFormState = {
  email: '',
  password: '',
  error: null,
  status: 'idle',
}

export function LoginForm({
  className,
  footer,
  submitLabel = 'Log in',
  submittingLabel = 'Logging in...',
  onSuccess,
}: LoginFormProps) {
  const router = useRouter()
  const [formState, setFormState] = useState<LoginFormState>(INITIAL_FORM_STATE)
  const { email, password, error, status } = formState

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0
  }, [email, password])

  const handleFieldChange = useCallback(
    (field: 'email' | 'password') => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value
      setFormState(previous => ({
        ...previous,
        [field]: value,
        error: null,
      }))
    },
    []
  )

  const handleSuccess = useCallback(() => {
    onSuccess?.()
    router.push('/app')
  }, [onSuccess, router])

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
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email,
            password,
          }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          const message = payload?.error?.message ?? 'Invalid email or password. Please try again.'

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
    [canSubmit, email, password, status, handleSuccess]
  )

  return (
    <div className={cn('space-y-4', className)}>
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-2">
          <label htmlFor="login-email" className="text-foreground text-sm font-medium">
            Email
          </label>
          <Input
            id="login-email"
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
          <label htmlFor="login-password" className="text-foreground text-sm font-medium">
            Password
          </label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={handleFieldChange('password')}
            placeholder="••••••••"
            minLength={1}
            required
            disabled={status === 'submitting'}
          />
        </div>

        {error ? (
          <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
            {error}
          </div>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          disabled={!canSubmit || status === 'submitting'}
          data-test-id="login-submit"
        >
          {status === 'submitting' ? submittingLabel : submitLabel}
        </Button>
      </form>

      {footer}
    </div>
  )
}
