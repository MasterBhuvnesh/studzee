import * as SecureStore from 'expo-secure-store';

import type { DownloadedPdfMetadata } from '@/types/storage';
import logger from '@/utils/logger';

const STORAGE_KEY = 'downloaded_pdfs';

/**
 * Save downloaded PDF metadata to secure storage
 */
export async function saveDownloadedPdf(
  pdf: DownloadedPdfMetadata
): Promise<void> {
  try {
    const existingPdfs = await getDownloadedPdfs();
    const updatedPdfs = [...existingPdfs, pdf];
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updatedPdfs));
    logger.success(`Saved PDF metadata: ${pdf.title}`);
  } catch (error) {
    logger.error(`Failed to save PDF metadata: ${error}`);
    throw new Error('Failed to save PDF metadata');
  }
}

/**
 * Retrieve all downloaded PDFs metadata from secure storage
 */
export async function getDownloadedPdfs(): Promise<DownloadedPdfMetadata[]> {
  try {
    const data = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!data) {
      return [];
    }
    return JSON.parse(data) as DownloadedPdfMetadata[];
  } catch (error) {
    logger.error(`Failed to retrieve PDF metadata: ${error}`);
    return [];
  }
}

/**
 * Remove a downloaded PDF metadata by document ID
 */
export async function removeDownloadedPdf(documentId: string): Promise<void> {
  try {
    const existingPdfs = await getDownloadedPdfs();
    const updatedPdfs = existingPdfs.filter(
      pdf => pdf.documentId !== documentId
    );
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updatedPdfs));
    logger.success(`Removed PDF metadata for document ID: ${documentId}`);
  } catch (error) {
    logger.error(`Failed to remove PDF metadata: ${error}`);
    throw new Error('Failed to remove PDF metadata');
  }
}

/**
 * Check if a PDF is already downloaded
 */
export async function isPdfDownloaded(documentId: string): Promise<boolean> {
  try {
    const existingPdfs = await getDownloadedPdfs();
    return existingPdfs.some(pdf => pdf.documentId === documentId);
  } catch (error) {
    logger.error(`Failed to check if PDF is downloaded: ${error}`);
    return false;
  }
}

/**
 * Get a specific downloaded PDF metadata by document ID
 */
export async function getDownloadedPdf(
  documentId: string
): Promise<DownloadedPdfMetadata | null> {
  try {
    const existingPdfs = await getDownloadedPdfs();
    return existingPdfs.find(pdf => pdf.documentId === documentId) || null;
  } catch (error) {
    logger.error(`Failed to get PDF metadata: ${error}`);
    return null;
  }
}
