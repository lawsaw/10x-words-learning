import { redirect } from 'next/navigation'

import LandingPageClient from './landing-page-client'
import type { FeatureCardVm } from './types'
import { FALLBACK_LANGUAGES_VM, fetchSessionStatus, fetchSupportedLanguages } from './public-data'

const FEATURE_CARDS_PRESET: FeatureCardVm[] = [
  {
    id: 'study-views',
    icon: 'table',
    title: 'Switch between study views instantly',
    description:
      'Toggle table and slider-based practice modes to reinforce terms the way that works best for you.',
  },
  {
    id: 'ai-generation',
    icon: 'sparkles',
    title: 'Generate fresh vocabulary with AI',
    description:
      'Spin up tailored word suggestions using your learning language, user language, and category context.',
  },
  {
    id: 'secure-workspace',
    icon: 'shield',
    title: 'Secure collaborative workspace',
    description:
      'Supabase-backed authentication keeps your categories and word history safe while you explore.',
  },
]

export default async function LandingPage() {
  const [sessionStatus, supportedLanguages] = await Promise.all([
    fetchSessionStatus(),
    fetchSupportedLanguages(),
  ])

  if (sessionStatus?.session) {
    redirect('/app')
  }

  return (
    <LandingPageClient
      languages={supportedLanguages ?? FALLBACK_LANGUAGES_VM}
      features={FEATURE_CARDS_PRESET}
    />
  )
}
