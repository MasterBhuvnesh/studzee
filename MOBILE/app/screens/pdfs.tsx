import { AppIcon } from '@/components/global/AppIcon';
import { CustomAlert } from '@/components/global/CustomAlert';
import CustomBottomSheetModal from '@/components/global/CustomBottomSheetModal';
import { DownloadedPdfInfo } from '@/components/global/DownloadedPdfInfo';
import { colors } from '@/constants/colors';
import { getPdfs } from '@/lib/api';
import { deletePdf, downloadPdf, openPdf, sharePdf } from '@/lib/download';
import { getDownloadedPdfs, isPdfDownloaded } from '@/lib/storage';
import { DownloadedPdfMetadata, PdfDocument } from '@/types';
import logger from '@/utils/logger';
import { useAuth } from '@clerk/clerk-expo';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  CheckCircle2,
  Download,
  Info,
  Loader,
  Loader2,
  X,
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

type TabType = 'available' | 'downloaded';

export default function PdfsPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const params = useLocalSearchParams<{ initialTab?: string }>();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // Tab state - set initial tab based on route params
  const [activeTab, setActiveTab] = useState<TabType>(
    (params.initialTab as TabType) || 'available'
  );

  // API data state
  const [pdfs, setPdfs] = useState<PdfDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Downloaded PDFs state
  const [downloadedPdfs, setDownloadedPdfs] = useState<DownloadedPdfMetadata[]>(
    []
  );
  const [downloadingIds, setDownloadingIds] = useState<string[]>([]);
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [selectedDownloadedPdf, setSelectedDownloadedPdf] =
    useState<DownloadedPdfMetadata | null>(null);

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

  // Fetch data
  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      // Fetch PDFs from API
      const pdfsResponse = await getPdfs({ page: 1, limit: 100 });
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
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(false);
  }, [fetchData]);

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
  const handleDownload = useCallback(async (item: PdfDocument) => {
    // Check if already downloaded
    const isAlreadyDownloaded = await isPdfDownloaded(item.documentId);
    if (isAlreadyDownloaded) {
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
  const performDownload = async (item: PdfDocument) => {
    try {
      setDownloadingIds(prev => [...prev, item.documentId]);

      const result = await downloadPdf(
        item.documentId,
        item.title,
        item.pdfName,
        item.pdfUrl,
        item.size
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

  // Downloaded PDF actions
  const openDownloadedPdf = useCallback((item: DownloadedPdfMetadata) => {
    setSelectedDownloadedPdf(item);
    bottomSheetRef.current?.present?.();
  }, []);

  const closeBottomSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss?.();
    setSelectedDownloadedPdf(null);
  }, []);

  const handleViewPdf = useCallback(async () => {
    if (!selectedDownloadedPdf) return;

    const success = await openPdf(selectedDownloadedPdf.localUri);
    if (!success) {
      showAlert('Error', 'Failed to open PDF', [
        { text: 'OK', style: 'cancel' },
      ]);
    }
  }, [selectedDownloadedPdf]);

  const handleSharePdf = useCallback(async () => {
    if (!selectedDownloadedPdf) return;

    const success = await sharePdf(selectedDownloadedPdf.localUri);
    if (!success) {
      showAlert('Error', 'Failed to share PDF', [
        { text: 'OK', style: 'cancel' },
      ]);
    }
  }, [selectedDownloadedPdf]);

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
                tintColor={colors.zinc[500]}
              />
            }
          >
            {/* Custom Header with Close Button */}
            <View className="px-6 pt-6">
              <View className="flex-row items-center justify-between">
                <Text className="py-2 font-product text-2xl text-zinc-800">
                  {activeTab === 'available'
                    ? 'Available PDFs'
                    : 'Downloaded PDFs'}
                </Text>
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="rounded-lg p-2 active:bg-zinc-100"
                  activeOpacity={0.7}
                >
                  <AppIcon
                    Icon={X}
                    color={colors.zinc[700]}
                    size={24}
                    strokeWidth={1.5}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View className="px-6 pb-8 pt-6">
              {/* Loading State */}
              {loading && (
                <View className="items-center justify-center py-12">
                  <AppIcon
                    Icon={Loader}
                    color={colors.zinc[400]}
                    size={32}
                    strokeWidth={1.5}
                  />
                  <Text className="mt-3 font-sans text-sm text-zinc-500">
                    Loading PDFs...
                  </Text>
                </View>
              )}

              {/* Error State */}
              {error && !loading && (
                <View className="overflow-hidden rounded-2xl border border-red-200 bg-red-50 p-6">
                  <Text className="font-product text-base text-red-800">
                    Error Loading PDFs
                  </Text>
                  <Text className="mt-2 font-sans text-sm text-red-600">
                    {error}
                  </Text>
                </View>
              )}

              {/* Available PDFs Tab Content */}
              {!loading && !error && activeTab === 'available' && (
                <>
                  {pdfs.length === 0 ? (
                    <View className="items-center justify-center rounded-2xl border border-zinc-200 bg-white py-12 shadow-lg">
                      <Text className="font-product text-base text-zinc-800">
                        No PDFs Available
                      </Text>
                      <Text className="mt-2 font-sans text-sm text-zinc-500">
                        Check back later for new content
                      </Text>
                    </View>
                  ) : (
                    <View className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
                      <View className="p-2">
                        {pdfs.map((pdf, index) => {
                          const isDownloading = downloadingIds.includes(
                            pdf.documentId
                          );
                          const isDownloaded = downloadedIds.includes(
                            pdf.documentId
                          );

                          return (
                            <View key={pdf.documentId}>
                              <View className="flex-row items-center justify-between rounded-xl px-4 py-2">
                                <TouchableOpacity
                                  onPress={() =>
                                    viewResourcePdf(pdf.pdfUrl, pdf.title)
                                  }
                                  className="flex-1 flex-row items-center"
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
                                      {pdf.title}
                                    </Text>
                                    <Text className="py-1 font-sans text-xs text-zinc-400">
                                      {(pdf.size / 1024).toFixed(0)} KB
                                    </Text>
                                  </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  onPress={() => handleDownload(pdf)}
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
                              {index < pdfs.length - 1 && (
                                <View className="mx-4 h-px bg-zinc-100" />
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </>
              )}

              {/* Downloaded PDFs Tab Content */}
              {!loading && activeTab === 'downloaded' && (
                <>
                  {downloadedPdfs.length === 0 ? (
                    <View className="items-center justify-center rounded-2xl border border-zinc-200 bg-white py-12 shadow-lg">
                      <Text className="font-product text-base text-zinc-800">
                        No Downloaded PDFs
                      </Text>
                      <Text className="mt-2 font-sans text-sm text-zinc-500">
                        Download PDFs to view them offline
                      </Text>
                    </View>
                  ) : (
                    <View className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
                      <View className="p-2">
                        {downloadedPdfs.map((pdf, index) => (
                          <View key={pdf.documentId}>
                            <TouchableOpacity
                              onPress={() => openDownloadedPdf(pdf)}
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
                                    {pdf.title}
                                  </Text>
                                  <Text className="py-1 font-sans text-xs text-zinc-400">
                                    {(pdf.size / 1024).toFixed(0)} KB •{' '}
                                    {new Date(
                                      pdf.downloadedAt
                                    ).toLocaleDateString()}
                                  </Text>
                                </View>
                                <AppIcon
                                  Icon={Info}
                                  color={colors.zinc[500]}
                                  size={16}
                                  strokeWidth={1.5}
                                />
                              </View>
                            </TouchableOpacity>
                            {index < downloadedPdfs.length - 1 && (
                              <View className="mx-4 h-px bg-zinc-100" />
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Bottom Sheet for Downloaded PDF Actions */}
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
