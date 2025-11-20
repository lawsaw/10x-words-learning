import { Children, ReactElement, ReactNode, cloneElement, isValidElement } from 'react'
import { notFound, redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'

import AppShellLayout from '@/components/app/app-shell-layout'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

import { CategoryLayoutClient } from './category-layout-client'

type CategoryLayoutProps = {
  children: ReactNode
  params: {
    learningLanguageId: string
    categoryId: string
  }
}

type ServerSupabaseClient = SupabaseClient<Database>

export type CategoryLayoutData = {
  userId: string
  categoryId: string
  learningLanguageId: string
  categoryName: string
  learningLanguageName: string
  learningLanguageCode: string
  userLanguage: string
}

export default async function CategoryLayout({ children, params }: CategoryLayoutProps) {
  const resolvedParams = await params
  const { learningLanguageId, categoryId } = resolvedParams

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

  const breadcrumbs = [
    { label: 'Workspace', href: '/app' },
    {
      label: context.learningLanguageName,
      href: `/app/${learningLanguageId}`,
    },
    { label: context.categoryName },
  ]

  const layoutValue: CategoryLayoutData = {
    userId: user.id,
    categoryId,
    learningLanguageId,
    categoryName: context.categoryName,
    learningLanguageName: context.learningLanguageName,
    learningLanguageCode: context.learningLanguageCode,
    userLanguage,
  }

  const childrenWithContext = Children.map(children, child => {
    if (!isValidElement(child)) {
      return child
    }

    return cloneElement(child as ReactElement<{ layoutContext?: CategoryLayoutData }>, {
      layoutContext: layoutValue,
    })
  })

  return (
    <AppShellLayout heading={context.categoryName} breadcrumbs={breadcrumbs}>
      <CategoryLayoutClient
        learningLanguageId={learningLanguageId}
        learningLanguageName={context.learningLanguageName}
        categoryId={categoryId}
      >
        {childrenWithContext}
      </CategoryLayoutClient>
    </AppShellLayout>
  )
}

type LearningLanguageContext = {
  categoryName: string
  learningLanguageName: string
  learningLanguageCode: string
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
