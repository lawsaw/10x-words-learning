import Link from 'next/link'
import { redirect } from 'next/navigation'

import { PasswordResetForm } from '@/components/public/password-reset-form'
import { PasswordResetRequestForm } from '@/components/public/password-reset-request-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { fetchSessionStatus } from '../public-data'

type ResetPasswordPageProps = {
  searchParams?:
    | Promise<{
        [key: string]: string | string[] | undefined
      }>
    | {
        [key: string]: string | string[] | undefined
      }
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const resolvedSearchParams = await searchParams
  const tokenValue = normalizeToken(resolvedSearchParams?.token)

  const sessionStatus = await fetchSessionStatus()
  if (sessionStatus?.session && !tokenValue) {
    redirect('/app')
  }

  const isResetMode = Boolean(tokenValue)

  return (
    <main className="flex flex-1 flex-col px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="border-border/60 from-muted/60 via-background to-background rounded-3xl border bg-gradient-to-br p-8 shadow-sm">
          <p className="text-primary text-sm font-semibold tracking-wide uppercase">
            Account recovery
          </p>
          <h1 className="text-foreground mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {isResetMode
              ? 'Choose a new password to re-enter your workspace'
              : 'Request a secure link to reset your password'}
          </h1>
          <p className="text-muted-foreground mt-3 text-base">
            We use Supabase-backed authentication, so password resets happen over HTTPS with
            short-lived tokens. Request a link using your account email, then return here to apply
            your new password.
          </p>
          <div className="text-foreground/80 mt-8 space-y-3 text-sm">
            <p className="flex items-start gap-2">
              <span className="bg-primary mt-1 h-2 w-2 rounded-full" />
              <span>Reset links expire quickly—run a new request if needed.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="bg-primary mt-1 h-2 w-2 rounded-full" />
              <span>
                We never display your password; everything goes directly to Supabase Auth.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="bg-primary mt-1 h-2 w-2 rounded-full" />
              <span>After a successful reset you&apos;ll be redirected to log in.</span>
            </p>
          </div>
        </section>

        <Card className="w-full max-w-lg justify-self-center">
          <CardHeader>
            <CardTitle>{isResetMode ? 'Set a new password' : 'Send reset instructions'}</CardTitle>
            <CardDescription>
              {isResetMode
                ? 'Enter and confirm your new password. We’ll update your Supabase session securely.'
                : 'Provide the email linked to your workspace and we’ll email you a password reset link.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isResetMode && tokenValue ? (
              <PasswordResetForm token={tokenValue} />
            ) : (
              <PasswordResetRequestForm />
            )}
          </CardContent>
          <CardFooter className="text-muted-foreground flex flex-col gap-2 text-sm">
            {isResetMode ? (
              <>
                <p>
                  Stuck on this screen? Request a new link{' '}
                  <Link
                    href="/reset-password"
                    className="text-primary font-medium underline-offset-4 hover:underline"
                  >
                    from here
                  </Link>
                  .
                </p>
                <p>
                  Once the password changes, return to{' '}
                  <Link
                    href="/auth/login"
                    className="text-primary font-medium underline-offset-4 hover:underline"
                  >
                    the login page
                  </Link>
                  .
                </p>
              </>
            ) : (
              <p>
                Remembered your credentials?{' '}
                <Link
                  href="/auth/login"
                  className="text-primary font-medium underline-offset-4 hover:underline"
                >
                  Log in instead
                </Link>
                .
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}

function normalizeToken(token: string | string[] | undefined): string | null {
  if (!token) {
    return null
  }

  const raw = Array.isArray(token) ? token[0] : token
  return raw.trim().length > 0 ? raw : null
}
