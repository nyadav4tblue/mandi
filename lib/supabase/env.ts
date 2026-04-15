/**
 * Resolve Supabase URL and anon key. When unset, use placeholders so
 * @supabase/ssr does not throw; API calls will not work until .env.local is filled.
 */
const DEV_URL = 'https://placeholder.supabase.co'
/** Non-empty string required by @supabase/ssr; not a real project. */
const DEV_ANON_KEY = 'development-placeholder-anon-key-not-for-production'

let warnedMissingEnv = false

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  return Boolean(url && key)
}

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (url) return url
  // Avoid warning in the browser on every client createClient(); auth pages show UI instead.
  if (
    process.env.NODE_ENV === 'development' &&
    typeof window === 'undefined' &&
    !warnedMissingEnv
  ) {
    console.warn(
      '[supabase] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. Add them to .env.local (see https://supabase.com/dashboard/project/_/settings/api). Using placeholders; auth and data will not work until configured.',
    )
    warnedMissingEnv = true
  }
  return DEV_URL
}

export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (key) return key
  return DEV_ANON_KEY
}
