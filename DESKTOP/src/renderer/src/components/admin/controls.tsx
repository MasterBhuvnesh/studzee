import * as React from 'react'

import { cn } from '@renderer/lib/utils'

export function PageHeader({
  title,
  description,
  actions
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Field({
  label,
  hint,
  children,
  className
}: {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-sm font-medium leading-none">{label}</label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  )
}

export function ErrorBanner({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  )
}

export function TagBadge({
  children,
  tone = 'default'
}: {
  children: React.ReactNode
  tone?: 'default' | 'accent'
}): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        tone === 'accent' ? 'bg-primary/10 text-primary' : 'bg-zinc-100 text-zinc-600'
      )}
    >
      {children}
    </span>
  )
}
