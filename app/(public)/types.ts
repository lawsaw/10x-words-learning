import type { LanguageDto } from "@/lib/types"

export type AuthModalKey = "login" | "register" | null

export type AuthModalControls = {
  onOpenLogin: () => void
  onOpenRegister: () => void
}

export type SupportedLanguagesVm = {
  items: Array<{
    code: LanguageDto["code"]
    label: string
  }>
}

export type FeatureCardIcon =
  | "sparkles"
  | "table"
  | "bot"
  | "shield"

export type FeatureCardVm = {
  id: string
  icon: FeatureCardIcon
  title: string
  description: string
}

