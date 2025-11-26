'use client'

import { FeatureGrid } from '@/components/public/feature-grid'
import { HeroSection } from '@/components/public/hero-section'
import { PrivacySection } from '@/components/public/privacy-section'
import { PublicFooter } from '@/components/public/public-footer'

import type { FeatureCardVm, SupportedLanguagesVm } from './types'

type LandingPageClientProps = {
  languages: SupportedLanguagesVm
  features: FeatureCardVm[]
}

export default function LandingPageClient({ languages, features }: LandingPageClientProps) {
  return (
    <>
      <main className="flex flex-1 flex-col">
        <HeroSection className="px-4 py-12 sm:px-6 lg:px-8" languages={languages} />
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <FeatureGrid features={features} />
        </section>
        <section className="px-4 pb-12 sm:px-6 lg:px-8">
          <PrivacySection />
        </section>
      </main>
      <PublicFooter />
    </>
  )
}
