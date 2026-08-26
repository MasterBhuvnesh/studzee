import { AuthenticateWithRedirectCallback } from '@clerk/react'

import Loading from '@renderer/components/Loading'

/**
 * Landing route for OAuth provider redirects. Clerk exchanges the code and
 * continues the pending sign in or sign up, then falls back to the console.
 */
export default function SsoCallbackPage(): React.JSX.Element {
  return (
    <>
      <AuthenticateWithRedirectCallback />
      <Loading />
    </>
  )
}
