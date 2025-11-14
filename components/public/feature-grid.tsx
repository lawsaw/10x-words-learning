import type { FeatureCardVm } from "@/app/(public)/types"

import { FeatureCard } from "./feature-card"

type FeatureGridProps = {
  features: FeatureCardVm[]
}

export function FeatureGrid({ features }: FeatureGridProps) {
  if (!features.length) {
    return null
  }

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="mx-auto w-full max-w-6xl space-y-10"
    >
      <div className="text-center">
        <h2
          id="features-heading"
          className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          Everything you need to stay consistent
        </h2>
        <p className="mt-3 text-base text-muted-foreground">
          Plan categories, review with precision, and let AI extend your
          vocabulary playbook—without leaving your workspace.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <FeatureCard key={feature.id} {...feature} />
        ))}
      </div>
    </section>
  )
}

