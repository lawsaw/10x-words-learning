import Link from 'next/link'

import { cn } from '@/lib/utils'

type AuthBrandMarkProps = {
  className?: string
}

export function AuthBrandMark({ className }: AuthBrandMarkProps) {
  return (
    <Link
      href="/"
      className={cn(
        'text-foreground hover:text-primary flex items-center gap-2 rounded-md text-base font-semibold tracking-tight transition-colors',
        className
      )}
      aria-label="Go to 10x Words Learning home page"
    >
      <span className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-2 py-1 text-xs leading-none font-semibold uppercase">
        10x
      </span>
      <span>Words Learning</span>
    </Link>
  )
}
