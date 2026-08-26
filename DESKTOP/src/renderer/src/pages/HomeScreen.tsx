import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/react'
import { BookOpen, KeyRound, Target, Users } from 'lucide-react'

import { hasApiToken, setApiToken } from '@renderer/lib/api'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const QUICK_LINKS = [
  {
    to: '/content/documents',
    label: 'Documents',
    description: 'Browse, edit and publish learning content',
    icon: BookOpen
  },
  {
    to: '/quests',
    label: 'Quests',
    description: 'Create limited time quests with gem rewards',
    icon: Target
  },
  {
    to: '/users',
    label: 'Users',
    description: 'Everyone registered for notifications',
    icon: Users
  }
]

export default function HomeScreen(): React.JSX.Element {
  const [tokenDraft, setTokenDraft] = useState('')
  const [saved, setSaved] = useState(hasApiToken())
  const { user } = useUser()
  const clerkEnabled = Boolean(CLERK_KEY)

  function handleSave(): void {
    setApiToken(tokenDraft)
    setTokenDraft('')
    setSaved(hasApiToken())
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Studzee Admin</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Console for the live API at studzee-api-latest.onrender.com.
          </p>
        </div>
        {clerkEnabled && <UserButton />}
      </div>

      {clerkEnabled ? (
        <p className="text-muted-foreground mt-6 text-sm">
          Signed in as{' '}
          <span className="font-medium text-zinc-800">
            {user?.primaryEmailAddress?.emailAddress ?? user?.fullName ?? 'unknown'}
          </span>
          . Admin routes mint a fresh session token for every call.
        </p>
      ) : (
        <div className="mt-6 rounded-xl border bg-white p-6">
          <div className="mb-1 flex items-center gap-2">
            <KeyRound className="size-4" />
            <h2 className="text-sm font-semibold">API token</h2>
            <span
              className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
                saved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {saved ? 'token saved' : 'no token'}
            </span>
          </div>
          <p className="text-muted-foreground mb-3 text-xs">
            Admin routes need a bearer token. Paste one from a Clerk session with the admin role, or
            the dev token while working locally. It stays in localStorage on this machine.
          </p>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Paste bearer token"
              value={tokenDraft}
              onChange={(e) => setTokenDraft(e.target.value)}
            />
            <Button onClick={handleSave} disabled={!tokenDraft.trim()}>
              Save
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="rounded-xl border bg-white p-4 transition-colors hover:bg-zinc-50"
          >
            <link.icon className="size-5" />
            <p className="mt-2 text-sm font-semibold">{link.label}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
