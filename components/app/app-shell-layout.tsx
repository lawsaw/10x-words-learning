import { Fragment, type ReactNode } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { LogoutButton } from "@/components/app/logout-button"

type BreadcrumbItem = {
  label: string
  href?: string
}

type AppShellLayoutProps = {
  heading?: ReactNode
  description?: string
  descriptionActions?: ReactNode
  breadcrumbs?: BreadcrumbItem[]
  children: ReactNode
  className?: string
}

export default function AppShellLayout({
  heading,
  description,
  descriptionActions,
  breadcrumbs,
  children,
  className,
}: AppShellLayoutProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-transparent text-foreground",
        className,
      )}
    >
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/app"
            className="flex items-center gap-2 rounded-md text-base font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
            aria-label="Go to workspace home"
          >
            <span className="inline-flex items-center rounded-md bg-primary px-2 py-1 text-xs font-semibold uppercase leading-none text-primary-foreground">
              10x
            </span>
            <span>Words Learning</span>
          </Link>
          <LogoutButton />
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1

                if (isLast) {
                  return (
                    <li
                      key={crumb.label}
                      aria-current="page"
                      className="font-medium text-foreground"
                    >
                      {crumb.label}
                    </li>
                  )
                }

                return (
                  <Fragment key={crumb.label}>
                    <li>
                      {crumb.href ? (
                        <Link
                          href={crumb.href}
                          className="transition-colors hover:text-foreground"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span>{crumb.label}</span>
                      )}
                    </li>
                    <li aria-hidden="true">/</li>
                  </Fragment>
                )
              })}
            </ol>
          </nav>
        ) : null}
        {heading ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {heading}
              </h1>
              <div id="app-shell-heading-actions" className="flex items-center gap-2" />
            </div>
            <div
              id="app-shell-description-actions"
              className={cn(descriptionActions ? "pt-2" : "")}
            >
              {descriptionActions}
            </div>
            {description ? (
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

