'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSupabaseReady } from '@/hooks/use-supabase-ready'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Leaf } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function LoginPage() {
  const supabaseReady = useSupabaseReady()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!supabaseReady) {
      setError(
        'Supabase env vars are missing. Locally: add them to .env.local. On Vercel: Project → Settings → Environment Variables → add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for Production, then Redeploy.',
      )
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2 text-primary">
              <Leaf className="h-8 w-8" />
              <span className="text-2xl font-bold">Mandi Manager</span>
            </div>
          </div>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to manage your mandi business
          </CardDescription>
        </CardHeader>
        <CardContent>
          {supabaseReady === false && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Supabase not configured</AlertTitle>
              <AlertDescription className="space-y-2 text-left">
                <span className="block">
                  Add <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
                  <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> from{' '}
                  <a
                    href="https://supabase.com/dashboard/project/_/settings/api"
                    className="underline font-medium"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Supabase → Project Settings → API
                  </a>
                  .
                </span>
                <span className="block text-muted-foreground">
                  <strong className="text-foreground">Local:</strong> put them in{' '}
                  <code className="text-xs">.env.local</code> and restart{' '}
                  <code className="text-xs">npm run dev</code>.
                </span>
                <span className="block text-muted-foreground">
                  <strong className="text-foreground">Vercel:</strong>{' '}
                  <a
                    href="https://vercel.com/docs/projects/environment-variables"
                    className="underline font-medium"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Project → Settings → Environment Variables
                  </a>
                  , scope to <strong>Production</strong> (and Preview if you use it), then{' '}
                  <strong>Redeploy</strong>. <code className="text-xs">.env.local</code> is not deployed.
                </span>
              </AlertDescription>
            </Alert>
          )}
          {supabaseReady === null && (
            <p className="text-sm text-muted-foreground mb-4 text-center">Checking configuration…</p>
          )}
          <form onSubmit={handleLogin}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
            </FieldGroup>

            {error && (
              <p className="text-sm text-destructive mt-4">{error}</p>
            )}

            <Button type="submit" className="w-full mt-6" disabled={loading || supabaseReady !== true}>
              {loading ? <Spinner className="mr-2" /> : null}
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {"Don't have an account? "}
            <Link href="/sign-up" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
