import * as React from 'react'

import { cn } from '@renderer/lib/utils'

/**
 * Shared shell for the auth screens: centered card over the console
 * background so sign in and sign up read as one flow.
 */
export function AuthCard({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <div className="flex h-full items-center justify-center bg-zinc-50 p-6">
      <div
        className={cn(
          'w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg',
          className
        )}
      >
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Studzee Admin</h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Content, quests and notifications for the live app.
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}

export function AuthError({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
      {message}
    </div>
  )
}
