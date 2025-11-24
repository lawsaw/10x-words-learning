import { redirect } from 'next/navigation'

import AppShellLayout from '@/components/app/app-shell-layout'
import { createClient } from '@/lib/supabase/server'

import WorkspaceClient, { LearningLanguageSummary } from './workspace-client'

type LanguageRow = {
  id: string
  language_id: string
  languages?: { code: string; name: string } | null | Array<{ code: string; name: string }>
  categories?: Array<{ id: string; name: string; words?: Array<{ count: number }> }> | null
}

export default async function AppHomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data, error } = await supabase
    .schema('app')
    .from('user_learning_languages')
    .select(
      `
        id,
        language_id,
        languages ( code, name ),
        categories ( id, name, words(count) )
      `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  const summaries: LearningLanguageSummary[] =
    (data as LanguageRow[] | null)?.map(row => {
      const languageMeta = Array.isArray(row.languages) ? row.languages[0] : row.languages

      const code = languageMeta?.code ?? row.language_id
      const name = languageMeta?.name ?? row.language_id.toUpperCase()

      const categories = Array.isArray(row.categories)
        ? row.categories
            .filter(category => Boolean(category?.id && typeof category.id === 'string'))
            .map(category => {
              const safeCategory = category as {
                id: string
                name?: string | null
                words?: Array<{ count: number }> | null
              }
              const wordCount =
                Array.isArray(safeCategory.words) && safeCategory.words[0]?.count != null
                  ? Number(safeCategory.words[0].count)
                  : 0
              return {
                id: safeCategory.id,
                name: safeCategory.name ?? 'Untitled category',
                wordCount,
              }
            })
        : []

      return {
        id: row.id,
        code,
        name,
        categories,
      }
    }) ?? []

  return (
    <AppShellLayout
      heading="Workspace"
      description="Select a learning language and category to start studying."
      breadcrumbs={[{ label: 'Workspace' }]}
    >
      <WorkspaceClient initialSummaries={summaries} />
    </AppShellLayout>
  )
}
