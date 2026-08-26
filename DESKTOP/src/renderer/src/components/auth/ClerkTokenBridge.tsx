import { useAuth } from '@clerk/react'
import { useEffect } from 'react'

import { setTokenProvider } from '@renderer/lib/api'

/**
 * Sits inside ClerkProvider and hands the api client a live token source.
 * Clerk session tokens expire in about a minute, so the client must mint
 * one per request instead of caching one at sign in.
 */
export function ClerkTokenBridge(): null {
  const { isSignedIn, getToken } = useAuth()

  useEffect(() => {
    if (isSignedIn) {
      setTokenProvider(() => getToken())
    } else {
      setTokenProvider(null)
    }
    return () => setTokenProvider(null)
  }, [isSignedIn, getToken])

  return null
}
