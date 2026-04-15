import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Build tools often inline `process.env.NEXT_PUBLIC_*` at compile time. If the build ran
 * before Vercel env was set, that bakes empty values. Concatenate keys so the lookup
 * stays runtime-bound on the server (see Next.js discussion on public env + SSR).
 */
function supabasePublicEnv(): { url?: string; key?: string } {
  const p = process.env
  const url = p['NEXT_PUBLIC_' + 'SUPABASE_URL']?.trim()
  const key = p['NEXT_PUBLIC_' + 'SUPABASE_ANON_KEY']?.trim()
  return { url: url || undefined, key: key || undefined }
}

export async function GET() {
  const { url, key } = supabasePublicEnv()
  return NextResponse.json({ ready: Boolean(url && key) })
}
