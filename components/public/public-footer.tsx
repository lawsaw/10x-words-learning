import type { ReactNode } from "react"

import Link from "next/link"

export function PublicFooter() {
  return (
    <footer
      aria-label="Site footer"
      className="border-t border-border/40 bg-background/80 py-10 backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="space-y-1">
          <div className="text-base font-semibold tracking-tight text-foreground">
            10x Words Learning
          </div>
          <p className="max-w-md">
            A focused vocabulary workspace helping polyglots retain and explore
            new words faster.
          </p>
        </div>
        <nav className="flex flex-wrap gap-4">
          <FooterLink href="#features">Product</FooterLink>
          <FooterLink href="#privacy">Security</FooterLink>
          <FooterLink href="mailto:hello@10xwords.app">Contact</FooterLink>
          <FooterLink href="/privacy">Privacy</FooterLink>
          <FooterLink href="/terms">Terms</FooterLink>
        </nav>
      </div>
      <div className="mx-auto mt-6 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs text-muted-foreground/80">
          &copy; {new Date().getFullYear()} 10x Words Learning. Built with Next.js,
          Supabase, and a love for languages.
        </p>
      </div>
    </footer>
  )
}

type FooterLinkProps = {
  href: string
  children: ReactNode
}

function FooterLink({ href, children }: FooterLinkProps) {
  const isInternalAnchor = href.startsWith("#")
  if (isInternalAnchor) {
    return (
      <a
        href={href}
        className="transition-colors hover:text-foreground"
      >
        {children}
      </a>
    )
  }

  return (
    <Link
      href={href}
      className="transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  )
}

