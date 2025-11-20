import { notFound, redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import type { CategoryWordsListDto } from '@/lib/types'
import { WordService } from '@/lib/services/word.service'
import { categoryParamsSchema, learningLanguageParamsSchema } from '@/lib/validation'

import CategoryWordTableClient from './category-word-table-client'

type PageParams = {
  learningLanguageId: string
  categoryId: string
}

type LearningLanguageContext = {
  categoryName: string
  learningLanguageName: string
  learningLanguageCode: string
}

type ServerSupabaseClient = SupabaseClient<Database>

export default async function CategoryWordTablePage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = await params

  if (!resolvedParams?.learningLanguageId || !resolvedParams?.categoryId) {
    notFound()
  }

  const { learningLanguageId } = learningLanguageParamsSchema.parse({
    learningLanguageId: resolvedParams.learningLanguageId,
  })
  const { categoryId } = categoryParamsSchema.parse({
    categoryId: resolvedParams.categoryId,
  })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const [context, userLanguage] = await Promise.all([
    fetchLearningLanguageContext(supabase, user.id, learningLanguageId, categoryId),
    fetchUserLanguage(supabase, user.id),
  ])

  if (!context) {
    notFound()
  }

  const initialWords = await fetchInitialCategoryWords(user.id, categoryId)

  return (
    <CategoryWordTableClient
      categoryId={categoryId}
      learningLanguageId={learningLanguageId}
      categoryName={context.categoryName}
      userLanguage={userLanguage}
      initialWords={initialWords}
      learningLanguageLabel={context.learningLanguageName}
      learningLanguageCode={context.learningLanguageCode}
    />
  )
}

async function fetchLearningLanguageContext(
  supabase: ServerSupabaseClient,
  userId: string,
  learningLanguageId: string,
  categoryId: string
): Promise<LearningLanguageContext | null> {
  const { data: categoryRow, error: categoryError } = await supabase
    .schema('app')
    .from('categories')
    .select('id, name, user_learning_language_id')
    .eq('id', categoryId)
    .eq('user_id', userId)
    .single()

  if (categoryError || !categoryRow) {
    return null
  }

  if (categoryRow.user_learning_language_id !== learningLanguageId) {
    return null
  }

  const { data: learningRow, error: learningError } = await supabase
    .schema('app')
    .from('user_learning_languages')
    .select('id, language_id')
    .eq('id', learningLanguageId)
    .eq('user_id', userId)
    .single()

  if (learningError || !learningRow) {
    return null
  }

  const { data: languageRow, error: languageError } = await supabase
    .schema('app')
    .from('languages')
    .select('code, name')
    .eq('code', learningRow.language_id)
    .single()

  if (languageError || !languageRow) {
    return null
  }

  return {
    categoryName: categoryRow.name,
    learningLanguageName: languageRow.name,
    learningLanguageCode: languageRow.code,
  }
}

async function fetchUserLanguage(supabase: ServerSupabaseClient, userId: string): Promise<string> {
  const { data: profileRow, error } = await supabase
    .schema('app')
    .from('profiles')
    .select('user_language_id')
    .eq('user_id', userId)
    .single()

  if (error || !profileRow) {
    throw new Error('Unable to resolve user language')
  }

  return profileRow.user_language_id
}

async function fetchInitialCategoryWords(
  userId: string,
  categoryId: string
): Promise<CategoryWordsListDto> {
  return WordService.getCategoryWords(userId, categoryId, {
    view: 'table',
    orderBy: 'createdAt',
    direction: 'desc',
  })
}
