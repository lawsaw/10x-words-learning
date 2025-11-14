"use client"

import { AuthModalSwitch } from "@/components/public/auth-modal-switch"
import { FeatureGrid } from "@/components/public/feature-grid"
import { HeroSection } from "@/components/public/hero-section"
import { LoginModal } from "@/components/public/login-modal"
import { PrivacySection } from "@/components/public/privacy-section"
import { RegisterModal } from "@/components/public/register-modal"
import { PublicFooter } from "@/components/public/public-footer"
import { PublicHeader } from "@/components/public/public-header"
import { useModalState } from "@/hooks/use-modal-state"

import type { AuthModalKey, FeatureCardVm, SupportedLanguagesVm } from "./types"

type LandingPageClientProps = {
  languages: SupportedLanguagesVm
  features: FeatureCardVm[]
  initialModal: AuthModalKey
}

export default function LandingPageClient({
  languages,
  features,
  initialModal,
}: LandingPageClientProps) {
  const { modalKey, openLogin, openRegister, closeModal, switchModal } =
    useModalState()

  const activeModal: AuthModalKey = modalKey ?? initialModal ?? null

  return (
    <div
      className="flex min-h-screen flex-col bg-background text-foreground"
      data-active-modal={activeModal ?? "none"}
    >
      <PublicHeader onOpenLogin={openLogin} onOpenRegister={openRegister} />
      <main className="flex flex-1 flex-col gap-16 px-4 py-12 sm:px-6 lg:px-8">
        <HeroSection
          languages={languages}
          onOpenLogin={openLogin}
          onOpenRegister={openRegister}
        />
        <FeatureGrid features={features} />
        <PrivacySection />
      </main>
      <PublicFooter />
      <AuthModalSwitch
        activeModal={activeModal}
        onClose={closeModal}
        onSwitch={switchModal}
        renderLoginModal={({ onClose, onSwitch }) => (
          <LoginModal
            open
            onClose={onClose}
            onSwitch={onSwitch}
          />
        )}
        renderRegisterModal={({ onClose, onSwitch }) => (
          <RegisterModal
            open
            onClose={onClose}
            onSwitch={onSwitch}
            initialLanguages={languages}
          />
        )}
      />
    </div>
  )
}

