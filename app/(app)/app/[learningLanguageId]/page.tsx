import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'

import AppShellLayout from '@/components/app/app-shell-layout'
import { createClient } from '@/lib/supabase/server'
import { learningLanguageParamsSchema } from '@/lib/validation'

import WorkspaceClient, { LearningLanguageSummary } from '../workspace-client'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ learningLanguageId: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const { learningLanguageId } = learningLanguageParamsSchema.parse(resolvedParams)
  const supabase = await createClient()

  const { data } = await supabase
    .schema('app')
    .from('user_learning_languages')
    .select('languages ( name )')
    .eq('id', learningLanguageId)
    .single()

  const languageName =
    data?.languages && !Array.isArray(data.languages) ? data.languages.name : 'Language'

  return {
    title: languageName,
  }
}

export default async function LearningLanguageHome({
  params,
}: {
  params: Promise<{ learningLanguageId: string }>
}) {
  const resolvedParams = await params
  const { learningLanguageId } = learningLanguageParamsSchema.parse(resolvedParams)

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
    .eq('id', learningLanguageId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    notFound()
  }

  const languageMeta = Array.isArray(data.languages) ? data.languages[0] : data.languages

  const summary: LearningLanguageSummary = {
    id: data.id,
    code: languageMeta?.code ?? data.language_id,
    name: languageMeta?.name ?? data.language_id.toUpperCase(),
    categories: Array.isArray(data.categories)
      ? data.categories
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
      : [],
  }

  return (
    <AppShellLayout
      heading={summary.name}
      description="Select a category to continue studying or add new ones for this language."
      breadcrumbs={[{ label: 'Workspace', href: '/app' }, { label: summary.name }]}
    >
      <WorkspaceClient initialSummaries={[summary]} />
    </AppShellLayout>
  )
}
