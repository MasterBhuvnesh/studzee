import { usePdfs, type PDFDocument } from '@renderer/hooks/usePdfs'
import { useState } from 'react'

import { Ring } from 'ldrs/react'
import 'ldrs/react/Ring.css'

import PDF from '@renderer/assets/images/pdf.svg'
import { AppIcon } from '@renderer/components/AppIcon'
import Loading from '@renderer/components/Loading'
import { Search } from 'lucide-react'
//  Helpers

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

//  PDFHeader

function PDFHeader({
  totalCount,
  searchQuery,
  onSearchChange
}: {
  totalCount: number
  searchQuery: string
  onSearchChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-medium text-gray-900">PDFs</h1>
        <p className="mt-1 text-sm font-medium text-gray-500">
          {totalCount} document{totalCount !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="relative w-full sm:w-72">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <AppIcon Icon={Search} size={16} color="#9ca3af" strokeWidth={2} />
        </div>
        <input
          type="text"
          placeholder="Search PDFs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
        />
      </div>
    </div>
  )
}

//  PDFItem

function PDFItem({ pdf }: { pdf: PDFDocument }) {
  return (
    <a
      href={pdf.pdfUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-xl border-2 border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-md "
    >
      <p className="truncate text-md font-medium text-gray-900 group-hover:text-gray-700 pb-2">
        {pdf.title}
      </p>
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-start gap-2 w-full ">
          {/* PDF Icon */}
          <img src={PDF} className="h-12 w-12" alt="pdf icon" />

          <div className="flex flex-col gap-1 min-w-0">
            <p className="truncate text-md text-gray-500">{pdf.pdfName}</p>
            <span className="text-sm text-gray-400">{formatFileSize(pdf.size)}</span>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-4 flex items-center gap-4 border-t-2 border-gray-100 pt-3 text-sm text-gray-400">
        <span>{formatDate(pdf.uploadedAt)}</span>
      </div>
    </a>
  )
}

//  PDFEmptyState

function PDFEmptyState() {
  return (
    <div className="flex h-60 flex-col items-center justify-center gap-4 text-center">
      <img src={PDF} className="h-12 w-12" alt="pdf icon" />
      <p className="text-md font-normal text-gray-500">No PDFs match your search</p>
    </div>
  )
}

//  PDFList

function PDFList({ pdfs }: { pdfs: PDFDocument[] }) {
  if (pdfs.length === 0) return <PDFEmptyState />

  return (
    <div className="grid grid-cols-2 gap-4">
      {pdfs.map((pdf) => (
        <PDFItem key={pdf.documentId} pdf={pdf} />
      ))}
    </div>
  )
}

//  PDFErrorState

function PDFErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="mb-2">
        <Ring size="20" stroke="2" bgOpacity="0" speed="3" color="#fb2c36" />
      </div>

      <div>
        <p className="text-lg font-normal text-gray-900">Failed to load PDFs</p>
        <p className="mt-1 text-base text-gray-500">{error}</p>
      </div>

      <button
        onClick={onRetry}
        className="rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-2.5 shadow-sm cursor-pointer hover:bg-zinc-100"
      >
        <p className="text-base text-zinc-700">Try again</p>
      </button>
    </div>
  )
}

//  PDFsPage

export default function PDFsPage() {
  const { pdfs, loading, error, refetch } = usePdfs()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPdfs = pdfs.filter(
    (pdf) =>
      pdf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pdf.pdfName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return <Loading />
  if (error) return <PDFErrorState error={error} onRetry={refetch} />

  return (
    <div className="space-y-6">
      <PDFHeader
        totalCount={pdfs.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <PDFList pdfs={filteredPdfs} />
    </div>
  )
}
