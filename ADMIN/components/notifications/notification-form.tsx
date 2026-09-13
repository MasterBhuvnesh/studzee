'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { SendNotificationInput } from '@/lib/backend/notifications'

type SendResult = { targeted: number; sent: number; failed: number; prunedTokens: number }

export function NotificationForm({
  emails,
  onSubmit,
}: {
  emails: string[]
  onSubmit: (input: SendNotificationInput) => Promise<SendResult>
}) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [sendToAll, setSendToAll] = useState(true)
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Empty is fine (no image); a non-empty value previews only when it parses
  // as a URL, which is also what the schema and the backend require.
  const previewUrl = (() => {
    if (!imageUrl.trim()) return null
    try {
      return new URL(imageUrl.trim()).toString()
    } catch {
      return null
    }
  })()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const result = await onSubmit({
        title,
        message,
        imageUrl: imageUrl.trim() || undefined,
        sendToAll,
        emails: sendToAll ? undefined : selectedEmails,
      })
      // BACKEND answers HTTP 207 for a partial delivery, which is still a
      // success status, so it never throws. Report the real counts rather
      // than a flat "sent" toast, otherwise a half-failed broadcast reads
      // as a full success.
      if (result.failed > 0) {
        toast.warning(
          `Delivered to ${result.sent} of ${result.targeted} devices, ${result.failed} failed` +
            (result.prunedTokens > 0 ? ` (${result.prunedTokens} stale tokens pruned)` : '')
        )
      } else {
        toast.success(`Delivered to ${result.sent} of ${result.targeted} devices`)
      }
      setTitle('')
      setMessage('')
      setImageUrl('')
      setSelectedEmails([])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-3">
      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-muted/40 shadow-none" required />
      </div>

      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Message</Label>
        <Input value={message} onChange={(e) => setMessage(e.target.value)} className="bg-muted/40 shadow-none" required />
      </div>

      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Image URL (optional)</Label>
        <div className="flex items-center gap-3">
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="bg-muted/40 shadow-none"
          />
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Notification image preview" className="h-10 w-10 shrink-0 rounded-md object-cover" />
          )}
        </div>
        {imageUrl.trim() && !previewUrl && (
          <p className="text-xs text-red-500">That is not a valid URL, the send will be rejected.</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="sendToAll" checked={sendToAll} onCheckedChange={(v) => setSendToAll(v === true)} />
        <Label htmlFor="sendToAll" className="text-sm">Send to all registered users</Label>
      </div>

      {!sendToAll && (
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
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send Notification'}
        </Button>
      </div>
    </form>
  )
}
