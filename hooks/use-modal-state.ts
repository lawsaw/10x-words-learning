"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import type { AuthModalKey } from "@/app/(public)/types"

const MODAL_SEARCH_PARAM = "modal"
const SUPPORTED_MODAL_KEYS: AuthModalKey[] = ["login", "register"]

export function useModalState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastSerializedSearchParamsRef = useRef<string>("")

  const modalParamValue = searchParams.get(MODAL_SEARCH_PARAM)
  const normalizedModalKey = useMemo<AuthModalKey>(() => {
    return parseModalKey(modalParamValue)
  }, [modalParamValue])

  const replaceSearchParams = useCallback(
    (nextModal: AuthModalKey) => {
      const currentParams = new URLSearchParams(searchParams.toString())

      if (nextModal) {
        currentParams.set(MODAL_SEARCH_PARAM, nextModal)
      } else {
        currentParams.delete(MODAL_SEARCH_PARAM)
      }

      const serialized = currentParams.toString()
      lastSerializedSearchParamsRef.current = serialized
      const target = serialized ? `${pathname}?${serialized}` : pathname

      router.replace(target, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    const serialized = searchParams.toString()
    if (serialized === lastSerializedSearchParamsRef.current) {
      return
    }

    lastSerializedSearchParamsRef.current = serialized

    if (modalParamValue && !normalizedModalKey) {
      replaceSearchParams(null)
    }
  }, [modalParamValue, normalizedModalKey, replaceSearchParams, searchParams])

  const openLogin = useCallback(() => {
    replaceSearchParams("login")
  }, [replaceSearchParams])

  const openRegister = useCallback(() => {
    replaceSearchParams("register")
  }, [replaceSearchParams])

  const closeModal = useCallback(() => {
    replaceSearchParams(null)
  }, [replaceSearchParams])

  const switchModal = useCallback(
    (next: AuthModalKey) => {
      if (!next) {
        replaceSearchParams(null)
        return
      }

      if (!SUPPORTED_MODAL_KEYS.includes(next)) {
        return
      }

      replaceSearchParams(next)
    },
    [replaceSearchParams],
  )

  return {
    modalKey: normalizedModalKey,
    openLogin,
    openRegister,
    closeModal,
    switchModal,
  }
}


function parseModalKey(value: string | null): AuthModalKey {
  if (!value) {
    return null
  }

  if (SUPPORTED_MODAL_KEYS.includes(value as AuthModalKey)) {
    return value as AuthModalKey
  }

  return null
}

