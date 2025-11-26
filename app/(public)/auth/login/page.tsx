import Link from 'next/link'
import { redirect } from 'next/navigation'

import { LoginForm } from '@/components/public/login-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { fetchSessionStatus } from '../../public-data'

const LOGIN_FEATURES = [
  'Resume study sessions from any device',
  'Keep AI-generated lists scoped to your profile',
  'Manage every learning language from one workspace',
]

export default async function LoginPage() {
  const sessionStatus = await fetchSessionStatus()
  if (sessionStatus?.session) {
    redirect('/app')
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="border-border/60 from-muted/60 via-background to-background rounded-3xl border bg-gradient-to-br p-8 shadow-sm">
          <p className="text-primary text-sm font-semibold tracking-wide uppercase">Welcome back</p>
          <h1 className="text-foreground mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Sign in and keep your vocabulary momentum going
          </h1>
          <p className="text-muted-foreground mt-3 text-base">
            Logging in restores your personalised workspace with learning languages, thematic
            categories, AI prompts, and slider-based review sessions.
          </p>
          <ul className="text-foreground/80 mt-8 space-y-3 text-sm">
            {LOGIN_FEATURES.map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="bg-primary mt-1 h-2 w-2 rounded-full" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <Card className="w-full max-w-lg justify-self-center">
          <CardHeader>
            <CardTitle>Log in to 10x Words Learning</CardTitle>
            <CardDescription>
              Enter your email and password to access your secure vocabulary workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm
              footer={
                <div className="text-muted-foreground flex flex-col gap-4 text-sm">
                  <Link
                    href="/reset-password"
                    className="text-primary font-medium underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                  <p>
                    Need an account?{' '}
                    <Link
                      href="/auth/register"
                      className="text-primary font-medium underline-offset-4 hover:underline"
                    >
                      Create one now
                    </Link>
                  </p>
                </div>
              }
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
