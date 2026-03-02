import { useEffect, useState } from 'react'

export interface PDFDocument {
  documentId: string
  title: string
  pdfName: string
  pdfUrl: string
  uploadedAt: string
  size: number
}

export function usePdfs() {
  const [pdfs, setPdfs] = useState<PDFDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchPdfs() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/pdfs')
      if (!response.ok) throw new Error(`Failed to fetch PDFs (${response.status})`)
      const json = await response.json()
      console.log(json)
      setPdfs(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPdfs()
  }, [])

  return { pdfs, loading, error, refetch: fetchPdfs }
}
