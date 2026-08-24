import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { colors } from '@/constants/colors';
import { deletePdf, downloadPdf, openPdf, sharePdf } from '@/lib/download';
import { getDownloadedPdfs, isPdfDownloaded } from '@/lib/storage';
import { DownloadedPdfMetadata } from '@/types';
import logger from '@/utils/logger';

import { ShowAlert } from './useCustomAlert';

/** Everything the download flow needs to know about one remote PDF. */
export interface RemotePdf {
  documentId: string;
  title: string;
  pdfName: string;
  pdfUrl: string;
  /** Bytes. Callers translate whatever their source displays into bytes. */
  size: number;
}

interface UsePdfDownloadsOptions {
  showAlert: ShowAlert;
}

/**
 * The whole local PDF library behind one hook: which PDFs are downloaded,
 * which are mid-download, the download flow with its re-download confirmation,
 * and the bottom sheet actions for a downloaded file. This was copy pasted
 * across pdfs.tsx and resources.tsx and is what [id].tsx was missing when it
 * rendered its Resources list without any download state.
 */
export function usePdfDownloads({ showAlert }: UsePdfDownloadsOptions) {
  const [downloadedPdfs, setDownloadedPdfs] = useState<DownloadedPdfMetadata[]>(
    []
  );
  const [downloadingIds, setDownloadingIds] = useState<string[]>([]);
  const [selectedDownloadedPdf, setSelectedDownloadedPdf] =
    useState<DownloadedPdfMetadata | null>(null);
  const sheetRef = useRef<BottomSheetModal>(null);

  const refresh = useCallback(async () => {
    try {
      setDownloadedPdfs(await getDownloadedPdfs());
    } catch (err) {
      logger.error(`Failed to load downloaded PDFs: ${err}`);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const downloadedIds = useMemo(
    () => downloadedPdfs.map(pdf => pdf.documentId),
    [downloadedPdfs]
  );
  // Metadata carries the source URL, so rows can be matched per PDF rather
  // than per document when one document holds several files.
  const downloadedUrls = useMemo(
    () => downloadedPdfs.map(pdf => pdf.originalUrl),
    [downloadedPdfs]
  );

  const performDownload = useCallback(
    async (pdf: RemotePdf) => {
      try {
        setDownloadingIds(prev => [...prev, pdf.documentId]);

        const result = await downloadPdf(
          pdf.documentId,
          pdf.title,
          pdf.pdfName,
          pdf.pdfUrl,
          pdf.size
        );

        if (result.success) {
          showAlert('Success', 'PDF downloaded successfully', [
            { text: 'OK', style: 'default' },
          ]);
          await refresh();
        } else {
          showAlert('Download Failed', result.error || 'Unknown error', [
            { text: 'OK', style: 'cancel' },
          ]);
        }
      } catch (err) {
        showAlert(
          'Download Failed',
          err instanceof Error ? err.message : 'Unknown error',
          [{ text: 'OK', style: 'cancel' }]
        );
      } finally {
        setDownloadingIds(prev => prev.filter(id => id !== pdf.documentId));
      }
    },
    [refresh, showAlert]
  );

  const download = useCallback(
    async (pdf: RemotePdf) => {
      if (!pdf.documentId || !pdf.pdfUrl) {
        showAlert('Error', 'Invalid PDF data', [
          { text: 'OK', style: 'cancel' },
        ]);
        return;
      }

      if (await isPdfDownloaded(pdf.documentId)) {
        showAlert(
          'PDF Already Downloaded',
          'This PDF has already been downloaded. Do you want to download it again?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Re-download',
              onPress: async () => {
                await deletePdf(pdf.documentId);
                await performDownload(pdf);
              },
            },
          ]
        );
        return;
      }

      await performDownload(pdf);
    },
    [performDownload, showAlert]
  );

  /** Stream a remote PDF in the in-app browser rather than downloading it. */
  const viewRemote = useCallback(
    async (pdfUrl: string, title: string) => {
      try {
        logger.info(`Opening PDF in browser: ${title}`);
        await WebBrowser.openBrowserAsync(pdfUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          controlsColor: colors.zinc[800],
          toolbarColor: colors.zinc[50],
        });
      } catch (err) {
        logger.error(`Failed to open PDF: ${err}`);
        showAlert('Error', 'Failed to open PDF', [
          { text: 'OK', style: 'cancel' },
        ]);
      }
    },
    [showAlert]
  );

  const openSheet = useCallback((pdf: DownloadedPdfMetadata) => {
    setSelectedDownloadedPdf(pdf);
    sheetRef.current?.present?.();
  }, []);

  const closeSheet = useCallback(() => {
    sheetRef.current?.dismiss?.();
    setSelectedDownloadedPdf(null);
  }, []);

  const viewSelected = useCallback(async () => {
    if (!selectedDownloadedPdf) return;
    const success = await openPdf(selectedDownloadedPdf.localUri);
    if (!success) {
      showAlert('Error', 'Failed to open PDF', [
        { text: 'OK', style: 'cancel' },
      ]);
    }
  }, [selectedDownloadedPdf, showAlert]);

  const shareSelected = useCallback(async () => {
    if (!selectedDownloadedPdf) return;
    const success = await sharePdf(selectedDownloadedPdf.localUri);
    if (!success) {
      showAlert('Error', 'Failed to share PDF', [
        { text: 'OK', style: 'cancel' },
      ]);
    }
  }, [selectedDownloadedPdf, showAlert]);

  const removeSelected = useCallback(async () => {
    if (!selectedDownloadedPdf) return;

    showAlert('Remove PDF', 'Are you sure you want to remove this PDF?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const success = await deletePdf(selectedDownloadedPdf.documentId);
          if (success) {
            showAlert('Success', 'PDF removed successfully', [
              { text: 'OK', style: 'default' },
            ]);
            await refresh();
            closeSheet();
          } else {
            showAlert('Error', 'Failed to remove PDF', [
              { text: 'OK', style: 'cancel' },
            ]);
          }
        },
      },
    ]);
  }, [closeSheet, refresh, selectedDownloadedPdf, showAlert]);

  return {
    downloadedPdfs,
    downloadedIds,
    downloadedUrls,
    downloadingIds,
    refresh,
    download,
    viewRemote,
    selectedDownloadedPdf,
    sheetRef,
    openSheet,
    closeSheet,
    viewSelected,
    shareSelected,
    removeSelected,
  };
}
