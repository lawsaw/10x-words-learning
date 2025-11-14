import Link from "next/link"

import type { AuthModalControls } from "@/app/(public)/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PublicHeaderProps = AuthModalControls & {
  className?: string
}

export function PublicHeader({
  onOpenLogin,
  onOpenRegister,
  className,
}: PublicHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md text-base font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
          aria-label="Go to 10x Words Learning home page"
        >
          <span className="inline-flex items-center rounded-md bg-primary px-2 py-1 text-xs font-semibold uppercase leading-none text-primary-foreground">
            10x
          </span>
          <span>Words Learning</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex">
          <a
            href="#features"
            className="transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#privacy"
            className="transition-colors hover:text-foreground"
          >
            Privacy
          </a>
          <a
            href="#languages"
            className="transition-colors hover:text-foreground"
          >
            Languages
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={onOpenLogin}
            aria-label="Open login modal"
          >
            Log in
          </Button>
          <Button onClick={onOpenRegister} aria-label="Open registration modal">
            Get started
          </Button>
        </div>
      </div>
    </header>
  )
}

