import { AppIcon } from '@/components/global/AppIcon';
import { CustomAlert } from '@/components/global/CustomAlert';
import CustomBottomSheetModal from '@/components/global/CustomBottomSheetModal';
import { DownloadedPdfInfo } from '@/components/global/DownloadedPdfInfo';
import { Header } from '@/components/global/Header';
import { colors } from '@/constants/colors';
import { getPdfs } from '@/lib/api';
import { deletePdf, downloadPdf, openPdf, sharePdf } from '@/lib/download';
import { getDownloadedPdfs, isPdfDownloaded } from '@/lib/storage';
import {
  DownloadedCardProps,
  DownloadedPdfMetadata,
  PdfDocument,
  PdfItem,
  ResourceCardProps,
} from '@/types';
import logger from '@/utils/logger';
import { useAuth } from '@clerk/clerk-expo';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  CheckCircle2,
  ChevronRight,
  Download,
  Info,
  Loader2,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ResourceCardWithDownloadProps extends ResourceCardProps {
  onDownload?: (item: any) => void;
  downloadingIds?: string[];
  downloadedIds?: string[];
  onViewAll?: () => void;
}

const ResourceCard = ({
  title,
  items,
  onDownload,
  downloadingIds = [],
  downloadedIds = [],
  onViewAll,
}: ResourceCardWithDownloadProps) => (
  <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
    <View className="relative flex-row items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
      <Text className="font-product text-base text-zinc-800">{title}</Text>
      <TouchableOpacity
        className="flex-row items-center gap-1"
        onPress={onViewAll}
        activeOpacity={0.7}
      >
        <Text className="font-sans text-sm text-zinc-500">View All PDFs</Text>
        <AppIcon
          Icon={ChevronRight}
          color={colors.zinc[500]}
          size={16}
          strokeWidth={1.5}
        />
      </TouchableOpacity>
    </View>
    <View className="p-2">
      {items.map((item, index) => {
        const isDownloading = item.documentId
          ? downloadingIds.includes(item.documentId)
          : false;
        const isDownloaded = item.documentId
          ? downloadedIds.includes(item.documentId)
          : false;

        return (
          <View key={index}>
            <View className="flex-row items-center justify-between rounded-xl px-4 py-2">
              <TouchableOpacity
                onPress={item.onPress}
                className="flex-1 flex-row items-center active:bg-zinc-50"
                activeOpacity={0.7}
              >
                <Image
                  source={require('@/assets/images/pdf.svg')}
                  style={{ width: 26, height: 26 }}
                  className="rounded-lg"
                />
                <View className="ml-3 flex-1">
                  <Text
                    className="font-sans text-base text-zinc-500"
                    numberOfLines={2}
                  >
                    {item.label}
                  </Text>
                  <Text className="py-1 font-sans text-xs text-zinc-400">
                    {item.size}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDownload?.(item)}
                className="ml-2 rounded-lg p-2 active:bg-zinc-100"
                activeOpacity={0.7}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <AppIcon
                    Icon={Loader2}
                    color={colors.zinc[400]}
                    size={20}
                    strokeWidth={1.5}
                  />
                ) : isDownloaded ? (
                  <AppIcon
                    Icon={CheckCircle2}
                    color={colors.green[600]}
                    size={20}
                    strokeWidth={1.5}
                  />
                ) : (
                  <AppIcon
                    Icon={Download}
                    color={colors.zinc[500]}
                    size={20}
                    strokeWidth={1.5}
                  />
                )}
              </TouchableOpacity>
            </View>
            {index < items.length - 1 && (
              <View className="mx-4 h-px bg-zinc-100" />
            )}
          </View>
        );
      })}
    </View>
  </View>
);

const DownloadedCard = ({
  title,
  items,
  onViewAll,
}: DownloadedCardProps & { onViewAll?: () => void }) => (
  <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
    <View className="relative flex-row items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
      <Text className="font-product text-base text-zinc-800">{title}</Text>
      <TouchableOpacity
        className="flex-row items-center gap-1"
        onPress={onViewAll}
        activeOpacity={0.7}
      >
        <Text className="font-sans text-sm text-zinc-500">View All PDFs</Text>
        <AppIcon
          Icon={ChevronRight}
          color={colors.zinc[500]}
          size={16}
          strokeWidth={1.5}
        />
      </TouchableOpacity>
    </View>
    <View className="p-2">
      {items.map((item: PdfItem, index: number) => (
        <View key={index}>
          <TouchableOpacity
            onPress={item.onPress}
            className="flex-row items-center justify-between rounded-xl px-4 py-2 active:bg-zinc-50"
            activeOpacity={0.7}
          >
            <View className="flex-1 flex-row items-center">
              <Image
                source={require('@/assets/images/pdf.svg')}
                style={{ width: 26, height: 26 }}
                className="rounded-lg"
              />
              <View className="ml-3 flex-1">
                <Text
                  className="font-sans text-base text-zinc-500"
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
                <Text className="py-1 font-sans text-xs text-zinc-400">
                  {item.size}
                </Text>
              </View>
              {item.icon && (
                <AppIcon
                  Icon={item.icon}
                  color={colors.zinc[500]}
                  size={16}
                  strokeWidth={1.5}
                />
              )}
            </View>
          </TouchableOpacity>
          {index < items.length - 1 && (
            <View className="mx-4 h-px bg-zinc-100" />
          )}
        </View>
      ))}
    </View>
  </View>
);

export default function ResourcesPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [selectedPdf, setSelectedPdf] = useState<PdfItem | null>(null);
  const [selectedDownloadedPdf, setSelectedDownloadedPdf] =
    useState<DownloadedPdfMetadata | null>(null);

  // API data state
  const [pdfs, setPdfs] = useState<PdfDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Downloaded PDFs state
  const [downloadedPdfs, setDownloadedPdfs] = useState<DownloadedPdfMetadata[]>(
    []
  );
  const [downloadingIds, setDownloadingIds] = useState<string[]>([]);
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);

  // Alert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: {
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }[];
  }>({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (
    title: string,
    message: string,
    buttons: {
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }[]
  ) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };

  const hideAlert = () => {
    setAlertConfig({ visible: false, title: '', message: '', buttons: [] });
  };

  // Fetch data from backend API and load downloaded PDFs
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch PDFs from API
        const pdfsResponse = await getPdfs({ page: 1, limit: 20 });
        setPdfs(pdfsResponse.data);

        // Load downloaded PDFs from storage
        const downloaded = await getDownloadedPdfs();
        setDownloadedPdfs(downloaded);
        setDownloadedIds(downloaded.map(pdf => pdf.documentId));

        logger.success('PDFs data fetched successfully');
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch PDFs';
        setError(errorMessage);
        logger.error(`Error fetching PDFs: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Refresh downloaded PDFs list
  const refreshDownloadedPdfs = useCallback(async () => {
    try {
      const downloaded = await getDownloadedPdfs();
      setDownloadedPdfs(downloaded);
      setDownloadedIds(downloaded.map(pdf => pdf.documentId));
    } catch (err) {
      logger.error(`Failed to refresh downloaded PDFs: ${err}`);
    }
  }, []);

  // Refresh state and function
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Fetch PDFs from API
      const pdfsResponse = await getPdfs({ page: 1, limit: 20 });
      setPdfs(pdfsResponse.data);

      // Load downloaded PDFs from storage
      await refreshDownloadedPdfs();

      logger.success('Resources refreshed successfully');
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to refresh resources';
      logger.error(`Error refreshing resources: ${errorMessage}`);
    } finally {
      setRefreshing(false);
    }
  }, [refreshDownloadedPdfs]);

  // View PDF in browser
  const viewResourcePdf = useCallback(async (pdfUrl: string, title: string) => {
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
  }, []);

  // Handle PDF download
  const handleDownload = useCallback(async (item: any) => {
    if (!item.documentId || !item.pdfUrl) {
      showAlert('Error', 'Invalid PDF data', [{ text: 'OK', style: 'cancel' }]);
      return;
    }

    // Check if already downloaded
    const isAlreadyDownloaded = await isPdfDownloaded(item.documentId);
    if (isAlreadyDownloaded) {
      // Show confirmation dialog
      showAlert(
        'PDF Already Downloaded',
        'This PDF has already been downloaded. Do you want to download it again?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Re-download',
            onPress: async () => {
              // Delete existing and re-download
              await deletePdf(item.documentId);
              await performDownload(item);
            },
          },
        ]
      );
      return;
    }

    await performDownload(item);
  }, []);

  // Perform the actual download
  const performDownload = async (item: any) => {
    try {
      setDownloadingIds(prev => [...prev, item.documentId]);

      const result = await downloadPdf(
        item.documentId,
        item.label,
        item.label, // Using label as pdfName
        item.pdfUrl,
        parseInt(item.size?.replace(/[^0-9]/g, '') || '0') * 1024 // Convert KB to bytes
      );

      if (result.success) {
        showAlert('Success', 'PDF downloaded successfully', [
          { text: 'OK', style: 'default' },
        ]);
        await refreshDownloadedPdfs();
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
      setDownloadingIds(prev => prev.filter(id => id !== item.documentId));
    }
  };

  const openDownloadedPdf = useCallback((item: DownloadedPdfMetadata) => {
    setSelectedDownloadedPdf(item);
    bottomSheetRef.current?.present?.();
  }, []);

  const closeBottomSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss?.();
    setSelectedDownloadedPdf(null);
  }, []);

  // Handle view PDF
  const handleViewPdf = useCallback(async () => {
    if (!selectedDownloadedPdf) return;

    const success = await openPdf(selectedDownloadedPdf.localUri);
    if (!success) {
      showAlert('Error', 'Failed to open PDF', [
        { text: 'OK', style: 'cancel' },
      ]);
    }
  }, [selectedDownloadedPdf]);

  // Handle share PDF
  const handleSharePdf = useCallback(async () => {
    if (!selectedDownloadedPdf) return;

    const success = await sharePdf(selectedDownloadedPdf.localUri);
    if (!success) {
      showAlert('Error', 'Failed to share PDF', [
        { text: 'OK', style: 'cancel' },
      ]);
    }
  }, [selectedDownloadedPdf]);

  // Handle remove PDF
  const handleRemovePdf = useCallback(async () => {
    if (!selectedDownloadedPdf) return;

    showAlert('Remove PDF', 'Are you sure you want to remove this PDF?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const success = await deletePdf(selectedDownloadedPdf.documentId);
          if (success) {
            showAlert('Success', 'PDF removed successfully', [
              { text: 'OK', style: 'default' },
            ]);
            await refreshDownloadedPdfs();
            closeBottomSheet();
          } else {
            showAlert('Error', 'Failed to remove PDF', [
              { text: 'OK', style: 'cancel' },
            ]);
          }
        },
      },
    ]);
  }, [selectedDownloadedPdf, refreshDownloadedPdfs, closeBottomSheet]);

  return (
    <>
      <LinearGradient
        colors={[colors.zinc[50], colors.zinc[100]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="flex-1"
      >
        <SafeAreaView className="flex-1 bg-transparent">
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.zinc[800]]}
                tintColor={colors.zinc[800]}
              />
            }
          >
            <Header title="Resources" />
            <View className="px-6 pb-8 pt-6">
              {/* Loading State - Skeleton Placeholders */}
              {loading && (
                <>
                  {/* Skeleton for PDFs Card */}
                  <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
                    <View className="relative flex-row items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                      <View className="h-5 w-32 rounded bg-zinc-200" />
                      <View className="h-4 w-24 rounded bg-zinc-200" />
                    </View>
                    <View className="p-2">
                      {[1, 2, 3].map(index => (
                        <View key={index}>
                          <View className="flex-row items-center rounded-xl px-4 py-2">
                            <View className="h-7 w-7 rounded-lg bg-zinc-100" />
                            <View className="ml-3 flex-1">
                              <View className="mb-2 h-4 w-3/4 rounded bg-zinc-100" />
                              <View className="h-3 w-16 rounded bg-zinc-100" />
                            </View>
                          </View>
                          {index < 3 && (
                            <View className="mx-4 h-px bg-zinc-50" />
                          )}
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Skeleton for Downloaded PDFs Card */}
                  <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
                    <View className="relative flex-row items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                      <View className="h-5 w-40 rounded bg-zinc-200" />
                      <View className="h-4 w-24 rounded bg-zinc-200" />
                    </View>
                    <View className="p-2">
                      {[1, 2].map(index => (
                        <View key={index}>
                          <View className="flex-row items-center rounded-xl px-4 py-2">
                            <View className="h-7 w-7 rounded-lg bg-zinc-100" />
                            <View className="ml-3 flex-1">
                              <View className="mb-2 h-4 w-4/5 rounded bg-zinc-100" />
                              <View className="h-3 w-16 rounded bg-zinc-100" />
                            </View>
                          </View>
                          {index < 2 && (
                            <View className="mx-4 h-px bg-zinc-50" />
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {/* Error State */}
              {error && !loading && (
                <View className="mb-6 overflow-hidden rounded-2xl border border-red-200 bg-red-50 p-6">
                  <Text className="font-product text-base text-red-800">
                    Error Loading Resources
                  </Text>
                  <Text className="mt-2 font-sans text-sm text-red-600">
                    {error}
                  </Text>
                </View>
              )}

              {/* PDFs from API */}
              {!loading && !error && pdfs.length > 0 && (
                <ResourceCard
                  title="Available PDFs"
                  items={pdfs.slice(0, 3).map(pdf => ({
                    label: pdf.title,
                    documentId: pdf.documentId,
                    pdfUrl: pdf.pdfUrl,
                    onPress: () => viewResourcePdf(pdf.pdfUrl, pdf.title),
                    size: `${(pdf.size / 1024).toFixed(0)} KB`,
                  }))}
                  onDownload={handleDownload}
                  downloadingIds={downloadingIds}
                  downloadedIds={downloadedIds}
                  onViewAll={() =>
                    router.push('/screens/pdfs?initialTab=available')
                  }
                />
              )}

              {/* Downloaded PDFs from storage */}
              {downloadedPdfs.length > 0 && (
                <DownloadedCard
                  title="Downloaded PDFs"
                  items={downloadedPdfs.slice(0, 2).map(pdf => ({
                    label: pdf.title,
                    onPress: () => openDownloadedPdf(pdf),
                    size: `${(pdf.size / 1024).toFixed(0)} KB`,
                    icon: Info,
                  }))}
                  onViewAll={() =>
                    router.push('/screens/pdfs?initialTab=downloaded')
                  }
                />
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      <CustomBottomSheetModal ref={bottomSheetRef}>
        <View className="flex-1 p-4">
          {selectedDownloadedPdf ? (
            <DownloadedPdfInfo
              title={selectedDownloadedPdf.title}
              location={selectedDownloadedPdf.localUri}
              size={`${(selectedDownloadedPdf.size / 1024).toFixed(0)} KB`}
              date={new Date(
                selectedDownloadedPdf.downloadedAt
              ).toLocaleDateString()}
              onView={handleViewPdf}
              onShare={handleSharePdf}
              onRemove={handleRemovePdf}
            />
          ) : (
            <View className="items-center justify-center py-8">
              <Text className="font-sans text-sm text-zinc-500">
                No PDF selected
              </Text>
            </View>
          )}
        </View>
      </CustomBottomSheetModal>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={hideAlert}
      />
    </>
  );
}
