import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/update-session'

/** Next.js 16+: `middleware` was renamed to `proxy` (same Edge behavior). */
export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request)
  } catch (err) {
    console.error('[proxy]', err)
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
