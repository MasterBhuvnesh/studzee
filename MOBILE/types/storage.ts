/**
 * Type definitions for local storage
 */

/**
 * Metadata for a downloaded PDF stored locally
 */
export interface DownloadedPdfMetadata {
  documentId: string;
  title: string;
  pdfName: string;
  localUri: string;
  size: number;
  downloadedAt: string; // ISO timestamp
  originalUrl: string;
}
