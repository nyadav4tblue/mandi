import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Server-side check so production reflects Vercel env without relying on client build-time inlining. */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  return NextResponse.json({ ready: Boolean(url && key) })
}
