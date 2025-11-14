import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

type AppLayoutProps = {
  children: ReactNode
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  return children
}


