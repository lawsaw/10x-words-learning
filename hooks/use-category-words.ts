import { useCallback } from "react"
import useSWR from "swr"

import type {
  CategoryWordsListDto,
  SortDirection,
  WordViewMode,
  WordOrderField,
} from "@/lib/types"

type UseCategoryWordsOptions = {
  categoryId: string
  view: WordViewMode
  orderBy: WordOrderField
  direction: SortDirection
  initialData: CategoryWordsListDto
  onError?: (message: string) => void
  onSuccess?: (data: CategoryWordsListDto) => void
}

type Key = ["category-words", string, WordViewMode, WordOrderField, SortDirection]

async function fetchCategoryWords([, categoryId, view, orderBy, direction]: Key) {
  const url = `/api/categories/${categoryId}/words?view=${view}&orderBy=${encodeURIComponent(orderBy)}&direction=${direction}`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message =
      payload?.error?.message ?? "Unable to fetch category words"
    throw new Error(message)
  }

  return (await response.json()) as CategoryWordsListDto
}

export function useCategoryWords({
  categoryId,
  view,
  orderBy,
  direction,
  initialData,
  onError,
  onSuccess,
}: UseCategoryWordsOptions) {
  const key: Key = ["category-words", categoryId, view, orderBy, direction]

  const swr = useSWR<CategoryWordsListDto, Error>(key, fetchCategoryWords, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    fallbackData: initialData,
    onError: (error) => {
      if (onError) {
        onError(error.message)
      }
    },
    onSuccess: (data) => {
      if (onSuccess) {
        onSuccess(data)
      }
    },
  })

  const refresh = useCallback(
    () => swr.mutate(undefined, { revalidate: true }),
    [swr],
  )

  return {
    data: swr.data,
    error: swr.error ?? null,
    errorMessage: swr.error?.message ?? null,
    isLoading: swr.isLoading,
    isValidating: swr.isValidating,
    mutate: refresh,
  }
}


