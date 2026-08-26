import { useState } from 'react'
import { useSignUp } from '@clerk/react/legacy'
import { Loader2 } from 'lucide-react'

import { AuthCard, AuthError } from './AuthCard'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Field } from '@renderer/components/admin/controls'

interface ClerkError {
  message?: string
}

export function SignUpForm({
  onSwitchToSignIn
}: {
  onSwitchToSignIn: () => void
}): React.JSX.Element {
  const { signUp, setActive, isLoaded } = useSignUp()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleCreate(): Promise<void> {
    if (!isLoaded) return
    setError('')
    setBusy(true)
    try {
      await signUp.create({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        emailAddress,
        password
      })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setVerifying(true)
    } catch (err) {
      const clerkErr = err as { errors?: ClerkError[] }
      setError(clerkErr.errors?.[0]?.message ?? 'Sign up failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify(): Promise<void> {
    if (!isLoaded) return
    setError('')
    setBusy(true)
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code: code.trim() })
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId })
      } else {
        setError('Verification is incomplete. Try the code again.')
      }
    } catch (err) {
      const clerkErr = err as { errors?: ClerkError[] }
      setError(clerkErr.errors?.[0]?.message ?? 'Verification failed')
    } finally {
      setBusy(false)
    }
  }

  if (verifying) {
    return (
      <AuthCard>
        <h2 className="mb-1 text-center text-base font-semibold">Verify your email</h2>
        <p className="text-muted-foreground mb-4 text-center text-xs">
          Enter the six digit code sent to {emailAddress}.
        </p>
        {error && <AuthError message={error} />}
        <div className="space-y-4">
          <Field label="Verification code">
            <Input
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleVerify()}
              className="text-center font-mono text-lg tracking-widest"
            />
          </Field>
          <Button className="w-full" onClick={() => void handleVerify()} disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="animate-spin" /> Verifying
              </>
            ) : (
              'Verify and finish'
            )}
          </Button>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      {error && <AuthError message={error} />}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Field label="First name">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label="Last name">
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
        </div>
        <Field label="Email">
          <Input
            type="email"
            autoComplete="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password" hint="At least 8 characters">
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button className="w-full" onClick={() => void handleCreate()} disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="animate-spin" /> Creating account
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </div>

      <p className="text-muted-foreground mt-6 text-center text-xs">
        Already have an account?{' '}
        <button
          className="font-medium text-zinc-900 underline underline-offset-2"
          onClick={onSwitchToSignIn}
          disabled={busy}
        >
          Sign in
        </button>
      </p>
    </AuthCard>
  )
}
