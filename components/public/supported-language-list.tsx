import type { SupportedLanguagesVm } from "@/app/(public)/types"
import { cn } from "@/lib/utils"

type SupportedLanguageListProps = {
  languages: SupportedLanguagesVm
  className?: string
}

export function SupportedLanguageList({
  languages,
  className,
}: SupportedLanguageListProps) {
  const items = languages.items ?? []
  const hasLanguages = items.length > 0

  return (
    <div className={cn("w-full", className)}>
      <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Supported languages
      </div>
      {hasLanguages ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <li
              key={item.code}
              className="rounded-full border border-border bg-background/80 px-3 py-1 text-sm font-medium text-foreground shadow-sm backdrop-blur"
            >
              {item.label}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          We&apos;re curating the best content—new languages are added every
          week.
        </p>
      )}
    </div>
  )
}

