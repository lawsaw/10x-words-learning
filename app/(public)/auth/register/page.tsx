import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AuthBrandMark } from '@/components/public/auth-brand-mark'
import { RegisterForm } from '@/components/public/register-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import {
  FALLBACK_LANGUAGES_VM,
  fetchSessionStatus,
  fetchSupportedLanguages,
} from '../../public-data'

const REGISTER_POINTS = [
  'Fix your user language once to keep AI prompts consistent',
  'Curate thematic categories for every learning language',
  'Switch between table and slider study modes instantly',
]

export default async function RegisterPage() {
  const [sessionStatus, supportedLanguages] = await Promise.all([
    fetchSessionStatus(),
    fetchSupportedLanguages(),
  ])

  if (sessionStatus?.session) {
    redirect('/app')
  }

  const languages = supportedLanguages ?? FALLBACK_LANGUAGES_VM

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="border-border/60 border-b">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <AuthBrandMark />
          <Link
            href="/auth/login"
            className="text-primary text-sm font-medium underline-offset-4 hover:underline"
          >
            Already have an account?
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_460px]">
          <section className="border-border/60 from-muted/60 via-background to-background rounded-3xl border bg-gradient-to-br p-8 shadow-sm">
            <p className="text-primary text-sm font-semibold tracking-wide uppercase">
              Get started
            </p>
            <h1 className="text-foreground mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Create your secure vocabulary workspace
            </h1>
            <p className="text-muted-foreground mt-3 text-base">
              Registration takes less than a minute. Choose your primary language, set a secure
              password, and keep every AI-generated list and study session tethered to your unique
              context.
            </p>
            <ul className="text-foreground/80 mt-8 space-y-3 text-sm">
              {REGISTER_POINTS.map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="bg-primary mt-1 h-2 w-2 rounded-full" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <Card className="w-full max-w-xl justify-self-center">
            <CardHeader>
              <CardTitle>Create your account</CardTitle>
              <CardDescription>
                We&apos;ll store your user language to tailor translations and AI prompts for every
                session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegisterForm
                initialLanguages={languages}
                footer={
                  <p className="text-muted-foreground text-sm">
                    Already registered?{' '}
                    <Link
                      href="/auth/login"
                      className="text-primary font-medium underline-offset-4 hover:underline"
                    >
                      Log in instead
                    </Link>
                  </p>
                }
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
