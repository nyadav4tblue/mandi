import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from './env'

export async function updateSession(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/config/')) {
    return NextResponse.next()
  }

  const passthrough = () => NextResponse.next({ request })

  try {
    let supabaseResponse = NextResponse.next({
      request,
    })

    if (!isSupabaseConfigured()) {
      if (request.nextUrl.pathname.startsWith('/dashboard')) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    const supabase = createServerClient(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            )
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            )
          },
        },
      },
    )

    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.error('[middleware] getUser:', error.message)
    }

    const effectiveUser = error ? null : (data?.user ?? null)

    if (
      request.nextUrl.pathname.startsWith('/dashboard') &&
      !effectiveUser
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (
      (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/sign-up') &&
      effectiveUser
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (err) {
    console.error('[middleware] updateSession failed', err)
    // Fail open: avoid 500; dashboard layout still enforces auth server-side.
    return passthrough()
  }
}
