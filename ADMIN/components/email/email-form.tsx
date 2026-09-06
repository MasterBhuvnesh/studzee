'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { SendEmailInput } from '@/lib/backend/email'

export function EmailForm({
  emails,
  onSubmit,
}: {
  emails: string[]
  onSubmit: (input: SendEmailInput) => Promise<void>
}) {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({ emails: selectedEmails, subject, title, body })
      toast.success('Email sent')
      setSubject('')
      setTitle('')
      setBody('')
      setSelectedEmails([])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-3">
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
        {emails.map((email) => (
          <label key={email} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selectedEmails.includes(email)}
              onCheckedChange={(v) =>
                setSelectedEmails((s) => (v === true ? [...s, email] : s.filter((e) => e !== email)))
              }
            />
            {email}
          </label>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Subject</Label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-muted/40 shadow-none" required />
      </div>

      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-muted/40 shadow-none" required />
      </div>

      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Body</Label>
        <Input value={body} onChange={(e) => setBody(e.target.value)} className="bg-muted/40 shadow-none" required />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg" disabled={submitting || selectedEmails.length === 0}>
          {submitting ? 'Sending...' : 'Send Email'}
        </Button>
      </div>
    </form>
  )
}
