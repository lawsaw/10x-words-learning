import { CheckCircle2 } from "lucide-react"

export function PrivacySection() {
  const highlights = [
    "Supabase-authenticated sessions with row level security",
    "Fine-grained control over every category and word list you create",
    "Transparent audit trails so you always know where data travels",
  ]

  return (
    <section
      id="privacy"
      aria-labelledby="privacy-heading"
      className="mx-auto w-full max-w-5xl rounded-3xl border border-border/40 bg-muted/30 px-8 py-12 shadow-inner sm:px-12"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2
          id="privacy-heading"
          className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          Built on privacy-first foundations
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Your learning data stays yours. Every workspace runs on Supabase with
          robust security defaults, dedicated tables, and row level policies
          safeguarding personal vocabulary history.
        </p>
      </div>
      <ul className="mt-8 grid gap-4 text-left sm:grid-cols-3">
        {highlights.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 rounded-2xl border border-border/40 bg-background/60 p-4 shadow-sm"
          >
            <CheckCircle2
              className="mt-1 h-5 w-5 flex-shrink-0 text-primary"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span className="text-sm text-muted-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

