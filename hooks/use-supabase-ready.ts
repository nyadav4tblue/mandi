'use client'

import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase/env'

/**
 * True when env is available to the client bundle, or when the server reports vars (e.g. Vercel after adding secrets without stale client bundle).
 */
export function useSupabaseReady(): boolean | null {
  const [ready, setReady] = useState<boolean | null>(() =>
    typeof window !== 'undefined' && isSupabaseConfigured() ? true : null,
  )

  useEffect(() => {
    if (isSupabaseConfigured()) {
      setReady(true)
      return
    }

    let cancelled = false
    fetch('/api/config/supabase')
      .then((r) => r.json())
      .then((data: { ready?: boolean }) => {
        if (!cancelled) setReady(Boolean(data.ready))
      })
      .catch(() => {
        if (!cancelled) setReady(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return ready
}
