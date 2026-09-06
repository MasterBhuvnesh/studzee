import { Shell } from '@/components/dashboard/shell'
import { listTopics } from '@/lib/backend/content'
import { DocumentForm } from '@/components/documents/document-form'
import { createDocumentAction } from '../actions'

export default async function NewDocumentPage() {
  const topics = await listTopics()

  return (
    <Shell breadcrumb="Documents / New" active="Documents">
      <h1 className="text-2xl font-medium tracking-tight">New Document</h1>
      <DocumentForm topics={topics} onSubmit={createDocumentAction} submitLabel="Create Document" />
    </Shell>
  )
}
