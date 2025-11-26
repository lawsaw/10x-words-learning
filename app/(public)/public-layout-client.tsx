'use client'

import { usePathname } from 'next/navigation'

import { PublicHeader } from '@/components/public/public-header'

type PublicLayoutClientProps = {
  children: React.ReactNode
}

type HeaderVariant = 'home' | 'login' | 'register' | 'reset-password'

export function PublicLayoutClient({ children }: PublicLayoutClientProps) {
  const pathname = usePathname()

  // Determine header variant based on pathname
  const getHeaderVariant = (): HeaderVariant => {
    if (pathname === '/auth/login') return 'login'
    if (pathname === '/auth/register') return 'register'
    if (pathname?.startsWith('/reset-password')) return 'reset-password'
    return 'home'
  }

  const variant = getHeaderVariant()

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <PublicHeader variant={variant} />
      {children}
    </div>
  )
}
