import { Bot, ShieldCheck, Sparkles, TableProperties, type LucideIcon } from 'lucide-react'

import type { FeatureCardIcon, FeatureCardVm } from '@/app/(public)/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<FeatureCardIcon, LucideIcon> = {
  sparkles: Sparkles,
  table: TableProperties,
  bot: Bot,
  shield: ShieldCheck,
}

type FeatureCardProps = FeatureCardVm & {
  className?: string
}

export function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  const Icon = ICON_MAP[icon]

  return (
    <Card
      className={cn(
        'border-border/50 bg-background/80 hover:border-primary/40 relative flex h-full flex-col overflow-hidden backdrop-blur transition hover:shadow-lg',
        className
      )}
    >
      <CardHeader className="space-y-6 p-4 sm:p-6">
        <div className="border-primary/20 bg-primary/10 text-primary inline-flex h-12 w-12 items-center justify-center rounded-2xl border">
          <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="mt-auto p-4 sm:p-6 sm:pt-0">
        <div className="border-border/60 bg-muted/40 text-muted-foreground rounded-xl border border-dashed p-4 text-xs">
          Coming soon: walkthrough videos and sample lists tailored to this feature.
        </div>
      </CardContent>
    </Card>
  )
}
