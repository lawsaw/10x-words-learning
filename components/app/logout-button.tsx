'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { supabaseClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser()

      if (user?.email) {
        setUserEmail(user.email)
      }
    }

    fetchUser()
  }, [])

  const handleLogout = async () => {
    if (loading) {
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        console.error('Failed to logout', await response.text())
      }
    } catch (error) {
      console.error('Logout error', error)
    } finally {
      setLoading(false)
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="flex items-center gap-2">
      {userEmail && (
        <span className="text-muted-foreground hidden text-sm sm:inline">{userEmail}</span>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleLogout}
        disabled={loading}
        aria-label={`Log out of 10x Words Learning${userEmail ? ` (${userEmail})` : ''}`}
      >
        {loading ? 'Logging out…' : 'Log out'}
      </Button>
    </div>
  )
}
