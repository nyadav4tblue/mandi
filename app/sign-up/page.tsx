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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Leaf } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function SignUpPage() {
  const supabaseReady = useSupabaseReady()
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<string>('staff')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!supabaseReady) {
      setError(
        'Supabase env vars are missing. Locally: .env.local. On Vercel: Environment Variables for Production, then Redeploy.',
      )
      setLoading(false)
      return
    }

    const supabase = createClient()
    // NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL is for local dev only (e.g. fixed tunnel URL).
    // If it were set to localhost on Vercel, confirmation emails would link to localhost.
    const emailRedirectTo =
      process.env.NODE_ENV === 'development' &&
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL?.trim()
        ? process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL.trim()
        : `${window.location.origin}/auth/callback`

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: fullName,
          phone: phone || null,
          role,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/sign-up/success')
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
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>
            Join your team to manage mandi operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {supabaseReady === false && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Supabase not configured</AlertTitle>
              <AlertDescription className="text-left text-sm">
                Set <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
                <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> from{' '}
                <a
                  href="https://supabase.com/dashboard/project/_/settings/api"
                  className="underline font-medium"
                  target="_blank"
                  rel="noreferrer"
                >
                  Supabase API settings
                </a>
                . Local: <code className="text-xs">.env.local</code> then restart dev. Vercel:{' '}
                <a
                  href="https://vercel.com/docs/projects/environment-variables"
                  className="underline font-medium"
                  target="_blank"
                  rel="noreferrer"
                >
                  Environment Variables
                </a>{' '}
                for Production → <strong>Redeploy</strong>.
              </AlertDescription>
            </Alert>
          )}
          {supabaseReady === null && (
            <p className="text-sm text-muted-foreground mb-4 text-center">Checking configuration…</p>
          )}
          <form onSubmit={handleSignUp}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone Number (Optional)</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
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
                  placeholder="Create a password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            {error && (
              <p className="text-sm text-destructive mt-4">{error}</p>
            )}

            <Button type="submit" className="w-full mt-6" disabled={loading || supabaseReady !== true}>
              {loading ? <Spinner className="mr-2" /> : null}
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
