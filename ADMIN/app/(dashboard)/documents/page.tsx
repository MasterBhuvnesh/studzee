import { Shell } from '@/components/dashboard/shell'
import { listDocuments } from '@/lib/backend/documents'
import { listTopics } from '@/lib/backend/content'
import { DocumentsTable } from './documents-table'

export default async function DocumentsPage() {
  const [{ data: documents }, topics] = await Promise.all([
    listDocuments({ limit: 100 }),
    listTopics(),
  ])

  return (
    <Shell breadcrumb="Documents" active="Documents">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-medium tracking-tight">Documents</h1>
      </div>
      <DocumentsTable documents={documents} topics={topics} />
    </Shell>
  )
}
