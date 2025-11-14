import type { AuthSessionStatusDto, LanguagesListDto } from "@/lib/types"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

import LandingPageClient from "./landing-page-client"
import type { AuthModalKey, FeatureCardVm, SupportedLanguagesVm } from "./types"

type LandingPagePageProps = {
  searchParams?:
    | Promise<{
        [key: string]: string | string[] | undefined
      }>
    | {
        [key: string]: string | string[] | undefined
      }
}

const FALLBACK_LANGUAGES_VM: SupportedLanguagesVm = {
  items: [],
}

const FEATURE_CARDS_PRESET: FeatureCardVm[] = [
  {
    id: "study-views",
    icon: "table",
    title: "Switch between study views instantly",
    description:
      "Toggle table and slider-based practice modes to reinforce terms the way that works best for you.",
  },
  {
    id: "ai-generation",
    icon: "sparkles",
    title: "Generate fresh vocabulary with AI",
    description:
      "Spin up tailored word suggestions using your learning language, user language, and category context.",
  },
  {
    id: "secure-workspace",
    icon: "shield",
    title: "Secure collaborative workspace",
    description:
      "Supabase-backed authentication keeps your categories and word history safe while you explore.",
  },
]

export default async function LandingPage({
  searchParams,
}: LandingPagePageProps) {
  const [sessionStatus, supportedLanguages] = await Promise.all([
    fetchSessionStatus(),
    fetchSupportedLanguages(),
  ])

  if (sessionStatus?.session) {
    redirect("/app")
  }

  const resolvedSearchParams = await searchParams
  const initialModal = parseModalKey(resolvedSearchParams?.modal)

  return (
    <LandingPageClient
      initialModal={initialModal}
      languages={supportedLanguages ?? FALLBACK_LANGUAGES_VM}
      features={FEATURE_CARDS_PRESET}
    />
  )
}

async function fetchSessionStatus(): Promise<AuthSessionStatusDto | null> {
  return fetchFromApi<AuthSessionStatusDto>("/api/auth/session")
}

async function fetchSupportedLanguages(): Promise<SupportedLanguagesVm | null> {
  const payload = await fetchFromApi<LanguagesListDto>(
    "/api/languages?scope=registration",
  )

  if (!payload) {
    return null
  }

  if (!Array.isArray(payload.languages) || payload.languages.length === 0) {
    return FALLBACK_LANGUAGES_VM
  }

  return {
    items: payload.languages.map((language) => ({
      code: language.code,
      label: language.name,
    })),
  }
}

async function fetchFromApi<T>(path: string): Promise<T | null> {
  const requestOrigin = await resolveRequestOrigin()

  if (!requestOrigin) {
    return null
  }

  const cookieHeaderValue = await serializeCookies()

  try {
    const response = await fetch(`${requestOrigin}${path}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        ...(cookieHeaderValue ? { cookie: cookieHeaderValue } : {}),
      },
    })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as T
  } catch {
    return null
  }
}

async function resolveRequestOrigin(): Promise<string | null> {
  const headerList = await headers()
  const forwardedHost = headerList.get("x-forwarded-host")
  const host = forwardedHost ?? headerList.get("host")

  if (!host) {
    return (
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      null
    )
  }

  const forwardedProto = headerList.get("x-forwarded-proto")
  const protocol =
    forwardedProto ?? (host.includes("localhost") ? "http" : "https")

  return `${protocol}://${host}`
}

async function serializeCookies(): Promise<string | null> {
  const cookieStore = await cookies()
  const serialized = cookieStore
    .getAll()
    .map((entry) => `${entry.name}=${entry.value}`)
    .join("; ")

  return serialized.length > 0 ? serialized : null
}

function parseModalKey(
  value: string | string[] | undefined,
): AuthModalKey {
  if (!value) {
    return null
  }

  const key = Array.isArray(value) ? value[0] : value

  if (key === "login" || key === "register") {
    return key
  }

  return null
}

