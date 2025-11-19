import type { SupportedLanguagesVm } from '@/app/(public)/types'
import { cn } from '@/lib/utils'

type SupportedLanguageListProps = {
  languages: SupportedLanguagesVm
  className?: string
}

export function SupportedLanguageList({ languages, className }: SupportedLanguageListProps) {
  const items = languages.items ?? []
  const hasLanguages = items.length > 0

  return (
    <div className={cn('w-full', className)}>
      <div className="text-muted-foreground text-center text-sm font-medium tracking-wide uppercase">
        Supported languages
      </div>
      {hasLanguages ? (
        <ul className="mt-3 flex flex-wrap justify-center gap-2">
          {items.map(item => (
            <li
              key={item.code}
              className="border-border bg-background/80 text-foreground rounded-full border px-3 py-1 text-sm font-medium shadow-sm backdrop-blur"
            >
              {item.label}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground mt-3 text-center text-sm">
          We&apos;re curating the best content—new languages are added every week.
        </p>
      )}
    </div>
  )
}
