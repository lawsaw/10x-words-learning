"use client"

import type { AuthModalControls, SupportedLanguagesVm } from "@/app/(public)/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { SupportedLanguageList } from "./supported-language-list"

type HeroSectionProps = AuthModalControls & {
  languages: SupportedLanguagesVm
  className?: string
}

export function HeroSection({
  languages,
  onOpenLogin,
  onOpenRegister,
  className,
}: HeroSectionProps) {
  return (
    <section
      id="hero"
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-primary/5 via-background to-secondary/20 px-6 py-16 shadow-sm sm:px-12",
        className,
      )}
      aria-labelledby="hero-heading"
    >
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-8 text-center">
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
          Learn 10× faster
        </div>
        <h1
          id="hero-heading"
          className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl"
        >
          Build vocabulary superpowers for every language you study
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Assemble themed word lists, switch between table and slider study modes, and let AI generate fresh terms based on your goals.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={onOpenRegister}>
            Create your free workspace
          </Button>
          <Button variant="ghost" size="lg" onClick={onOpenLogin}>
            I already have an account
          </Button>
        </div>

        <SupportedLanguageList languages={languages} />
      </div>
    </section>
  )
}

