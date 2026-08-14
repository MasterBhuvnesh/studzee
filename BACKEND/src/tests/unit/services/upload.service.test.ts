/**
 * UNIT TESTS FOR THE UPLOAD SERVICE
 *
 * S3 and Mongo are both replaced, so nothing here touches Supabase, MinIO or a
 * database. The behaviours worth pinning are the ones that would silently
 * corrupt storage rather than throw:
 *
 * - An image upload keys on the document id, so a replacement overwrites rather
 *   than accumulating orphans, and the previous object is deleted first.
 * - A failed delete of the old image must not abort the new upload, otherwise a
 *   single stale object permanently blocks replacing a document image.
 * - A PDF upload appends to an array that may not exist yet, and the key comes
 *   from a sanitised title rather than the client supplied filename.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { uploadService, type UploadedFile } from '@/services/upload.service'

const { DocumentModel, uploadToS3, deleteFromS3, getObjectRef, cache } =
  vi.hoisted(() => ({
    DocumentModel: { findById: vi.fn() },
    uploadToS3: vi.fn(),
    deleteFromS3: vi.fn(),
    getObjectRef: vi.fn(),
    cache: { invalidateAllCache: vi.fn(), invalidateDocumentCache: vi.fn() },
  }))

vi.mock('@/models/document.model', () => ({ DocumentModel }))
vi.mock('@/config', () => ({
  config: { S3_BUCKET_IMAGES: 'images', S3_BUCKET_PDFS: 'pdfs' },
  uploadToS3,
  deleteFromS3,
  getObjectRef,
}))
vi.mock('@/utils/cache', () => cache)

const DOC_ID = '6a7a252536340fa86988a957' // 24 chars, a valid ObjectId shape

const file = (overrides: Partial<UploadedFile> = {}): UploadedFile => ({
  buffer: Buffer.from('data'),
  originalname: 'My Report.pdf',
  mimetype: 'application/pdf',
  size: 4,
  ...overrides,
})

const doc = (overrides: Record<string, unknown> = {}) => ({
  title: 'My Report',
  imageUrl: undefined as string | undefined,
  pdfUrl: [] as unknown,
  save: vi.fn().mockResolvedValue(undefined),
  ...overrides,
})

describe('uploadDocumentImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject a document id that is not 24 characters', async () => {
    await expect(
      uploadService.uploadDocumentImage('too-short', file())
    ).rejects.toThrow('Invalid document ID format')

    // Rejected before any lookup, so a malformed id never reaches Mongo.
    expect(DocumentModel.findById).not.toHaveBeenCalled()
  })

  it('should reject an empty document id', async () => {
    await expect(
      uploadService.uploadDocumentImage('', file())
    ).rejects.toThrow('Invalid document ID format')
  })

  it('should throw when the document does not exist', async () => {
    DocumentModel.findById.mockResolvedValue(null)

    await expect(
      uploadService.uploadDocumentImage(DOC_ID, file())
    ).rejects.toThrow('Document not found')
    expect(uploadToS3).not.toHaveBeenCalled()
  })

  it('should key the object on the document id and the mime subtype', async () => {
    DocumentModel.findById.mockResolvedValue(doc())
    uploadToS3.mockResolvedValue({ url: 'https://cdn.test/img.png' })

    await uploadService.uploadDocumentImage(
      DOC_ID,
      file({ mimetype: 'image/png' })
    )

    expect(uploadToS3).toHaveBeenCalledWith(
      expect.any(Buffer),
      'images',
      `${DOC_ID}.png`,
      'image/png'
    )
  })

  it('should fall back to jpg when the mimetype has no subtype', async () => {
    DocumentModel.findById.mockResolvedValue(doc())
    uploadToS3.mockResolvedValue({ url: 'https://cdn.test/img.jpg' })

    await uploadService.uploadDocumentImage(DOC_ID, file({ mimetype: 'image' }))

    expect(uploadToS3.mock.calls[0][2]).toBe(`${DOC_ID}.jpg`)
  })

  it('should delete the previous image before uploading the replacement', async () => {
    DocumentModel.findById.mockResolvedValue(
      doc({ imageUrl: 'https://cdn.test/old.png' })
    )
    getObjectRef.mockReturnValue({ bucket: 'images', key: 'old.png' })
    uploadToS3.mockResolvedValue({ url: 'https://cdn.test/new.png' })

    await uploadService.uploadDocumentImage(DOC_ID, file({ mimetype: 'image/png' }))

    expect(getObjectRef).toHaveBeenCalledWith('https://cdn.test/old.png')
    expect(deleteFromS3).toHaveBeenCalledWith({ bucket: 'images', key: 'old.png' })
  })

  it('should not attempt a delete when the document has no image yet', async () => {
    DocumentModel.findById.mockResolvedValue(doc())
    uploadToS3.mockResolvedValue({ url: 'https://cdn.test/img.png' })

    await uploadService.uploadDocumentImage(DOC_ID, file({ mimetype: 'image/png' }))

    expect(deleteFromS3).not.toHaveBeenCalled()
  })

  it('should continue with the upload when deleting the old image fails', async () => {
    DocumentModel.findById.mockResolvedValue(
      doc({ imageUrl: 'https://cdn.test/old.png' })
    )
    getObjectRef.mockReturnValue({ bucket: 'images', key: 'old.png' })
    deleteFromS3.mockRejectedValue(new Error('AccessDenied'))
    uploadToS3.mockResolvedValue({ url: 'https://cdn.test/new.png' })

    const result = await uploadService.uploadDocumentImage(
      DOC_ID,
      file({ mimetype: 'image/png' })
    )

    // An orphaned old object is a smaller problem than a document whose image
    // can never be replaced.
    expect(result.imageUrl).toBe('https://cdn.test/new.png')
  })

  it('should save the new URL onto the document and invalidate its cache', async () => {
    const document = doc()
    DocumentModel.findById.mockResolvedValue(document)
    uploadToS3.mockResolvedValue({ url: 'https://cdn.test/new.png' })

    const result = await uploadService.uploadDocumentImage(
      DOC_ID,
      file({ mimetype: 'image/png' })
    )

    expect(document.imageUrl).toBe('https://cdn.test/new.png')
    expect(document.save).toHaveBeenCalledTimes(1)
    expect(cache.invalidateDocumentCache).toHaveBeenCalledWith(DOC_ID)
    expect(result).toEqual({
      imageUrl: 'https://cdn.test/new.png',
      documentId: DOC_ID,
    })
  })

  it('should propagate an upload failure rather than swallowing it', async () => {
    DocumentModel.findById.mockResolvedValue(doc())
    uploadToS3.mockRejectedValue(new Error('NoSuchBucket'))

    await expect(
      uploadService.uploadDocumentImage(DOC_ID, file({ mimetype: 'image/png' }))
    ).rejects.toThrow('NoSuchBucket')
    expect(cache.invalidateDocumentCache).not.toHaveBeenCalled()
  })
})

describe('uploadDocumentPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw when the document does not exist', async () => {
    DocumentModel.findById.mockResolvedValue(null)

    await expect(
      uploadService.uploadDocumentPdf(DOC_ID, file())
    ).rejects.toThrow('Document not found')
  })

  it('should key the object on the sanitised title, not the uploaded filename', async () => {
    DocumentModel.findById.mockResolvedValue(
      doc({ title: 'Physics: Unit 3  Notes!' })
    )
    uploadToS3.mockResolvedValue({
      url: 'https://cdn.test/p.pdf',
      uploadedAt: '2026-08-14',
      size: 4,
    })

    await uploadService.uploadDocumentPdf(
      DOC_ID,
      file({ originalname: '../../etc/passwd.pdf' })
    )

    // Lowercased, punctuation dropped, runs of spaces collapsed to one hyphen.
    expect(uploadToS3).toHaveBeenCalledWith(
      expect.any(Buffer),
      'pdfs',
      'physics-unit-3-notes.pdf',
      'application/pdf',
      '../../etc/passwd.pdf'
    )
  })

  it('should append to the pdf array and keep the original filename as the label', async () => {
    const document = doc({
      pdfUrl: [{ name: 'existing.pdf', url: 'https://cdn.test/e.pdf' }],
    })
    DocumentModel.findById.mockResolvedValue(document)
    uploadToS3.mockResolvedValue({
      url: 'https://cdn.test/p.pdf',
      uploadedAt: '2026-08-14',
      size: 99,
    })

    const result = await uploadService.uploadDocumentPdf(
      DOC_ID,
      file({ originalname: 'My Report.pdf' })
    )

    expect((document.pdfUrl as unknown[]).length).toBe(2)
    expect(result.pdf).toEqual({
      name: 'My Report.pdf',
      url: 'https://cdn.test/p.pdf',
      uploadedAt: '2026-08-14',
      size: 99,
    })
  })

  it('should initialise pdfUrl when it is not already an array', async () => {
    const document = doc({ pdfUrl: undefined })
    DocumentModel.findById.mockResolvedValue(document)
    uploadToS3.mockResolvedValue({
      url: 'https://cdn.test/p.pdf',
      uploadedAt: '2026-08-14',
      size: 4,
    })

    await uploadService.uploadDocumentPdf(DOC_ID, file())

    // Documents predating the multi-PDF change carry a string or nothing here.
    expect(Array.isArray(document.pdfUrl)).toBe(true)
    expect((document.pdfUrl as unknown[]).length).toBe(1)
  })

  it('should invalidate the whole cache, since a PDF changes list responses too', async () => {
    DocumentModel.findById.mockResolvedValue(doc())
    uploadToS3.mockResolvedValue({
      url: 'https://cdn.test/p.pdf',
      uploadedAt: '2026-08-14',
      size: 4,
    })

    await uploadService.uploadDocumentPdf(DOC_ID, file())

    expect(cache.invalidateAllCache).toHaveBeenCalledTimes(1)
  })

  it('should propagate an upload failure', async () => {
    DocumentModel.findById.mockResolvedValue(doc())
    uploadToS3.mockRejectedValue(new Error('EntityTooLarge'))

    await expect(
      uploadService.uploadDocumentPdf(DOC_ID, file())
    ).rejects.toThrow('EntityTooLarge')
    expect(cache.invalidateAllCache).not.toHaveBeenCalled()
  })
})
