import { useCallback, useState } from "react"

import type {
  CreateWordCommand,
  UpdateWordCommand,
} from "@/lib/types"

type BusyState = "create" | "update" | "delete" | null

type UseWordMutationsOptions = {
  categoryId: string
  onMutated?: () => Promise<void> | void
  onError?: (message: string) => void
}

type MutationErrorState = {
  create?: string | null
  update?: string | null
  delete?: string | null
}

export function useWordMutations({
  categoryId,
  onMutated,
  onError,
}: UseWordMutationsOptions) {
  const [busy, setBusy] = useState<BusyState>(null)
  const [errors, setErrors] = useState<MutationErrorState>({})

  const handleResponse = useCallback(async (response: Response) => {
    if (response.ok) {
      return
    }

    const payload = await response.json().catch(() => null)
    const message =
      payload?.error?.message ?? "Word operation failed. Please retry."
    throw new Error(message)
  }, [])

  const notifyMutated = useCallback(async () => {
    if (!onMutated) {
      return
    }

    await onMutated()
  }, [onMutated])

  const notifyError = useCallback(
    (error: unknown) => {
      if (!onError) {
        return
      }

      const message =
        error instanceof Error ? error.message : "Unexpected error occurred."
      onError(message)
    },
    [onError],
  )

  const createWord = useCallback(
    async (command: CreateWordCommand) => {
      setBusy("create")
      setErrors((prev) => ({ ...prev, create: null }))
      try {
        const response = await fetch(
          `/api/categories/${categoryId}/words`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(command),
          },
        )

        await handleResponse(response)
        await notifyMutated()
      } catch (error) {
        notifyError(error)
        throw error
      } finally {
        setBusy(null)
      }
    },
    [categoryId, handleResponse, notifyMutated, notifyError],
  )

  const updateWord = useCallback(
    async (wordId: string, command: UpdateWordCommand) => {
      setBusy("update")
      setErrors((prev) => ({ ...prev, update: null }))
      try {
        const response = await fetch(`/api/words/${wordId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        })

        await handleResponse(response)
        await notifyMutated()
      } catch (error) {
        notifyError(error)
        throw error
      } finally {
        setBusy(null)
      }
    },
    [handleResponse, notifyMutated, notifyError],
  )

  const deleteWord = useCallback(
    async (wordId: string) => {
      setBusy("delete")
      setErrors((prev) => ({ ...prev, delete: null }))
      try {
        const response = await fetch(`/api/words/${wordId}`, {
          method: "DELETE",
        })

        await handleResponse(response)
        await notifyMutated()
      } catch (error) {
        notifyError(error)
        throw error
      } finally {
        setBusy(null)
      }
    },
    [handleResponse, notifyMutated, notifyError],
  )

  return {
    busy,
    createWord,
    updateWord,
    deleteWord,
    errors,
  }
}


