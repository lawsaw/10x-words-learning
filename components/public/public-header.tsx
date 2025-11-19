import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PublicHeaderProps = {
  className?: string
}

export function PublicHeader({ className }: PublicHeaderProps) {
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
          <Button variant="ghost" asChild aria-label="Go to login page">
            <Link href="/auth/login">Log in</Link>
          </Button>
          <Button asChild aria-label="Go to registration page">
            <Link href="/auth/register">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
