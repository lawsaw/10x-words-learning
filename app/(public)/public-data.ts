import { cookies, headers } from 'next/headers'

import type { AuthSessionStatusDto, LanguagesListDto } from '@/lib/types'
import type { SupportedLanguagesVm } from './types'

export const FALLBACK_LANGUAGES_VM: SupportedLanguagesVm = {
  items: [],
}

export async function fetchSessionStatus(): Promise<AuthSessionStatusDto | null> {
  return fetchFromApi<AuthSessionStatusDto>('/api/auth/session')
}

export async function fetchSupportedLanguages(): Promise<SupportedLanguagesVm | null> {
  const payload = await fetchFromApi<LanguagesListDto>('/api/languages?scope=registration')

  if (!payload) {
    return null
  }

  if (!Array.isArray(payload.languages) || payload.languages.length === 0) {
    return FALLBACK_LANGUAGES_VM
  }

  return {
    items: payload.languages.map(language => ({
      code: language.code,
      label: language.name,
    })),
  }
}

export async function fetchFromApi<T>(path: string): Promise<T | null> {
  const requestOrigin = await resolveRequestOrigin()

  if (!requestOrigin) {
    return null
  }

  const cookieHeaderValue = await serializeCookies()

  try {
    const response = await fetch(`${requestOrigin}${path}`, {
      method: 'GET',
      cache: 'no-store',
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
  const forwardedHost = headerList.get('x-forwarded-host')
  const host = forwardedHost ?? headerList.get('host')

  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? null
  }

  const forwardedProto = headerList.get('x-forwarded-proto')
  const protocol = forwardedProto ?? (host.includes('localhost') ? 'http' : 'https')

  return `${protocol}://${host}`
}

async function serializeCookies(): Promise<string | null> {
  const cookieStore = await cookies()
  const serialized = cookieStore
    .getAll()
    .map(entry => `${entry.name}=${entry.value}`)
    .join('; ')

  return serialized.length > 0 ? serialized : null
}
