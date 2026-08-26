import { useEffect, useState } from 'react'
import { Send } from 'lucide-react'

import { ApiError, listUserEmailsSafe, sendPushNotification } from '@renderer/lib/api'
import { ErrorBanner, Field, PageHeader } from '@renderer/components/admin/controls'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'

export default function PushNotificationPage(): React.JSX.Element {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [sendToAll, setSendToAll] = useState(true)
  const [emailsText, setEmailsText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [knownEmails, setKnownEmails] = useState<string[]>([])

  useEffect(() => {
    listUserEmailsSafe()
      .then(setKnownEmails)
      .catch(() => setKnownEmails([]))
  }, [])

  async function handleSend(): Promise<void> {
    setError(null)
    setResultMessage(null)

    const emails = emailsText
      .split('\n')
      .map((e) => e.trim())
      .filter(Boolean)

    if (!title.trim() || !message.trim()) {
      setError('Title and message are required.')
      return
    }
    if (!sendToAll && emails.length === 0) {
      setError('Add at least one recipient email, or switch to send to all.')
      return
    }

    setSending(true)
    try {
      const result = await sendPushNotification({
        title: title.trim(),
        message: message.trim(),
        imageUrl: imageUrl.trim() || undefined,
        sendToAll,
        emails: sendToAll ? undefined : emails
      })
      setResultMessage(result.message ?? 'Push notification sent.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send push notification')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Push notification"
        description="Broadcast to every registered device, or target specific users by email."
      />
      {error && <ErrorBanner message={error} />}
      {resultMessage && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {resultMessage}
        </div>
      )}

      <div className="space-y-4 rounded-xl border bg-white p-6">
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <Field label="Message">
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
        </Field>

        <Field label="Image URL" hint="Optional banner shown in the push">
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://"
          />
        </Field>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={sendToAll}
            onChange={(e) => setSendToAll(e.target.checked)}
            className="size-4"
          />
          <span className="text-sm font-medium">Send to all registered devices</span>
        </label>

        {!sendToAll && (
          <Field
            label="Recipients"
            hint={
              knownEmails.length > 0
                ? `One email per line. ${knownEmails.length} registered addresses are known.`
                : 'One email per line.'
            }
          >
            <Textarea
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
              rows={5}
              placeholder={knownEmails.slice(0, 3).join('\n')}
              className="font-mono text-xs"
            />
          </Field>
        )}

        <div className="border-t pt-4">
          <Button onClick={() => void handleSend()} disabled={sending}>
            <Send /> {sending ? 'Sending' : 'Send notification'}
          </Button>
        </div>
      </div>
    </div>
  )
}
