import type { LanguageDto } from '@/lib/types'

export type SupportedLanguagesVm = {
  items: Array<{
    code: LanguageDto['code']
    label: string
  }>
}

export type FeatureCardIcon = 'sparkles' | 'table' | 'bot' | 'shield'

export type FeatureCardVm = {
  id: string
  icon: FeatureCardIcon
  title: string
  description: string
}
