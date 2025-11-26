import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/app/theme-toggle'

type PublicHeaderVariant = 'home' | 'login' | 'register' | 'reset-password'

type PublicHeaderProps = {
  variant?: PublicHeaderVariant
  className?: string
}

export function PublicHeader({ variant = 'home', className }: PublicHeaderProps) {
  return (
    <header
      className={cn(
        'border-border/40 bg-background/80 sticky top-0 z-40 border-b backdrop-blur',
        className
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-foreground hover:text-primary flex items-center gap-2 rounded-md text-base font-semibold tracking-tight transition-colors"
          aria-label="Go to 10x Words Learning home page"
        >
          <span className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-2 py-1 text-xs leading-none font-semibold uppercase">
            10x
          </span>
          <span>Words Learning</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {variant === 'home' && (
            <>
              <Button variant="ghost" asChild aria-label="Go to login page">
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button asChild aria-label="Go to registration page">
                <Link href="/auth/register">Get started</Link>
              </Button>
            </>
          )}
          {variant === 'login' && (
            <Link
              href="/auth/register"
              className="text-primary text-sm font-medium underline-offset-4 hover:underline"
            >
              Need an account?
            </Link>
          )}
          {variant === 'register' && (
            <Link
              href="/auth/login"
              className="text-primary text-sm font-medium underline-offset-4 hover:underline"
            >
              Already have an account?
            </Link>
          )}
          {variant === 'reset-password' && (
            <Link
              href="/auth/login"
              className="text-primary text-sm font-medium underline-offset-4 hover:underline"
            >
              Back to login
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
