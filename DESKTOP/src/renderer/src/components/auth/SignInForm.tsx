import { useState } from 'react'
import { useSignIn } from '@clerk/react/legacy'
import { Chrome, Github, Loader2 } from 'lucide-react'

import { AuthCard, AuthError } from './AuthCard'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Field } from '@renderer/components/admin/controls'

interface ClerkError {
  message?: string
}

export function SignInForm({
  onSwitchToSignUp
}: {
  onSwitchToSignUp: () => void
}): React.JSX.Element {
  const { signIn, setActive, isLoaded } = useSignIn()
  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'form' | 'google' | 'github' | null>(null)

  async function handleEmailSignIn(): Promise<void> {
    if (!isLoaded) return
    setError('')
    setBusy('form')
    try {
      const attempt = await signIn.create({
        identifier: emailAddress,
        password
      })
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId })
      } else {
        setError('Sign in is incomplete. Check your details and try again.')
      }
    } catch (err) {
      const clerkErr = err as { errors?: ClerkError[] }
      setError(clerkErr.errors?.[0]?.message ?? 'Sign in failed')
    } finally {
      setBusy(null)
    }
  }

  async function handleOAuth(strategy: 'oauth_google' | 'oauth_github'): Promise<void> {
    if (!isLoaded) return
    setError('')
    setBusy(strategy === 'oauth_google' ? 'google' : 'github')
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/'
      })
    } catch (err) {
      const clerkErr = err as { errors?: ClerkError[] }
      setError(clerkErr.errors?.[0]?.message ?? 'Provider sign in failed')
      setBusy(null)
    }
  }

  const providerIcon =
    busy === 'google' ? (
      <Chrome />
    ) : busy === 'github' ? (
      <Github />
    ) : busy === 'form' ? (
      <Loader2 className="animate-spin" />
    ) : null

  return (
    <AuthCard>
      {error && <AuthError message={error} />}

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={() => void handleOAuth('oauth_google')}
          disabled={busy !== null}
        >
          <Chrome /> Google
          {busy === 'google' && providerIcon}
        </Button>
        <Button
          variant="outline"
          onClick={() => void handleOAuth('oauth_github')}
          disabled={busy !== null}
        >
          <Github /> GitHub
          {busy === 'github' && providerIcon}
        </Button>
      </div>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-zinc-200" />
        <span className="text-muted-foreground text-xs">or continue with email</span>
        <span className="h-px flex-1 bg-zinc-200" />
      </div>

      <div className="space-y-4">
        <Field label="Email">
          <Input
            type="email"
            autoComplete="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleEmailSignIn()}
          />
        </Field>
        <Button
          className="w-full"
          onClick={() => void handleEmailSignIn()}
          disabled={busy !== null}
        >
          {busy === 'form' ? (
            <>
              <Loader2 className="animate-spin" /> Signing in
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </div>

      <p className="text-muted-foreground mt-6 text-center text-xs">
        No account?{' '}
        <button
          className="font-medium text-zinc-900 underline underline-offset-2"
          onClick={onSwitchToSignUp}
          disabled={busy !== null}
        >
          Create one
        </button>
      </p>
    </AuthCard>
  )
}
