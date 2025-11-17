import Link from "next/link"

import { cn } from "@/lib/utils"

type AuthBrandMarkProps = {
  className?: string
}

export function AuthBrandMark({ className }: AuthBrandMarkProps) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 rounded-md text-base font-semibold tracking-tight text-foreground transition-colors hover:text-primary",
        className,
      )}
      aria-label="Go to 10x Words Learning home page"
    >
      <span className="inline-flex items-center rounded-md bg-primary px-2 py-1 text-xs font-semibold uppercase leading-none text-primary-foreground">
        10x
      </span>
      <span>Words Learning</span>
    </Link>
  )
}


