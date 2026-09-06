'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function UploadFields({ documentId }: { documentId: string }) {
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)

  async function handleUpload(
    kind: 'upload-image' | 'upload-pdf',
    file: File,
    setBusy: (v: boolean) => void
  ) {
    setBusy(true)
    try {
      const formData = new FormData()
      formData.append(kind === 'upload-image' ? 'image' : 'pdf', file)
      const response = await fetch(`/api/documents/${documentId}/${kind}`, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message ?? 'Upload failed')
      }
      toast.success('Upload complete')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-3">
      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Cover Image
        </Label>
        <Input
          type="file"
          accept="image/*"
          disabled={uploadingImage}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUpload('upload-image', file, setUploadingImage)
          }}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          PDF Attachment
        </Label>
        <Input
          type="file"
          accept="application/pdf"
          disabled={uploadingPdf}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUpload('upload-pdf', file, setUploadingPdf)
          }}
        />
      </div>
    </div>
  )
}
