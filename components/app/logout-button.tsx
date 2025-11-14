"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    if (loading) {
      return
    }
    setLoading(true)
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (!response.ok) {
        console.error("Failed to logout", await response.text())
      }
    } catch (error) {
      console.error("Logout error", error)
    } finally {
      setLoading(false)
      router.push("/")
      router.refresh()
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={loading}
      aria-label="Log out of 10x Words Learning"
    >
      {loading ? "Logging out…" : "Log out"}
    </Button>
  )
}

