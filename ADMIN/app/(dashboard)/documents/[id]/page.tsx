import { notFound } from 'next/navigation'
import { Shell } from '@/components/dashboard/shell'
import { getDocument } from '@/lib/backend/documents'
import { listTopics } from '@/lib/backend/content'
import { DocumentForm } from '@/components/documents/document-form'
import { UploadFields } from '@/components/documents/upload-fields'
import { updateDocumentAction, deleteDocumentAction } from '../actions'
import { Button } from '@/components/ui/button'

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // A document deleted after the list rendered, or a backend older than the
  // admin read route, answers 404 here. Show the not-found page rather than
  // the runtime error overlay.
  let document
  let topics
  try {
    ;[document, topics] = await Promise.all([getDocument(id), listTopics()])
  } catch {
    notFound()
  }

  return (
    <Shell breadcrumb="Documents / Edit" active="Documents">
      <h1 className="text-2xl font-medium tracking-tight">Edit Document</h1>
      <DocumentForm
        topics={topics}
        initial={document}
        onSubmit={updateDocumentAction.bind(null, id)}
        submitLabel="Save Changes"
      />
      <UploadFields documentId={id} />
      <form action={deleteDocumentAction.bind(null, id)}>
        <Button type="submit" variant="destructive">
          Delete Document
        </Button>
      </form>
    </Shell>
  )
}
