import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { CategoryWordsListDto } from '@/lib/types'
import { WordService } from '@/lib/services/word.service'

import CategorySliderClient from './slider-client'

type PageParams = {
  learningLanguageId: string
  categoryId: string
}

type SliderContext = {
  categoryName: string
  learningLanguageName: string
  learningLanguageCode: string
}

export default async function CategorySliderPage({ params }: { params: PageParams }) {
  const resolvedParams = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const context = await fetchSliderContext(
    supabase,
    user.id,
    resolvedParams.learningLanguageId,
    resolvedParams.categoryId
  )

  if (!context) {
    notFound()
  }

  const initialWords = await WordService.getCategoryWords(user.id, resolvedParams.categoryId, {
    view: 'slider',
    orderBy: 'createdAt',
    direction: 'asc',
  })

  return (
    <CategorySliderClient
      categoryId={resolvedParams.categoryId}
      learningLanguageId={resolvedParams.learningLanguageId}
      learningLanguageLabel={context.learningLanguageName}
      learningLanguageCode={context.learningLanguageCode}
      categoryName={context.categoryName}
      initialWords={initialWords}
    />
  )
}

async function fetchSliderContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  learningLanguageId: string,
  categoryId: string
): Promise<SliderContext | null> {
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
    .select('language_id')
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
