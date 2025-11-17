import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthBrandMark } from "@/components/public/auth-brand-mark"
import { LoginForm } from "@/components/public/login-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { fetchSessionStatus } from "../../public-data"

const LOGIN_FEATURES = [
  "Resume study sessions from any device",
  "Keep AI-generated lists scoped to your profile",
  "Manage every learning language from one workspace",
]

export default async function LoginPage() {
  const sessionStatus = await fetchSessionStatus()
  if (sessionStatus?.session) {
    redirect("/app")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <AuthBrandMark />
          <Link
            href="/auth/register"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Need an account?
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-muted/60 via-background to-background p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Welcome back
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Sign in and keep your vocabulary momentum going
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Logging in restores your personalised workspace with learning
              languages, thematic categories, AI prompts, and slider-based
              review sessions.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-foreground/80">
              {LOGIN_FEATURES.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <Card className="w-full max-w-lg justify-self-center">
            <CardHeader>
              <CardTitle>Log in to 10x Words Learning</CardTitle>
              <CardDescription>
                Enter your email and password to access your secure vocabulary
                workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm
                footer={
                  <div className="flex flex-col gap-4 text-sm text-muted-foreground">
                    <Link
                      href="/reset-password"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                    <p>
                      Need an account?{" "}
                      <Link
                        href="/auth/register"
                        className="font-medium text-primary underline-offset-4 hover:underline"
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
    </div>
  )
}


