import { AppIcon } from '@/components/global/AppIcon';
import { CustomAlert } from '@/components/global/CustomAlert';
import CustomBottomSheetModal from '@/components/global/CustomBottomSheetModal';
import { DownloadedPdfInfo } from '@/components/global/DownloadedPdfInfo';
import { BottomFade } from '@/components/global/BottomFade';
import { Header } from '@/components/global/Header';
import { colors } from '@/constants/colors';
import { getPdfs } from '@/lib/api';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { usePdfDownloads } from '@/hooks/usePdfDownloads';
import {
  DownloadedCardProps,
  PdfDocument,
  PdfItem,
  ResourceCardProps,
} from '@/types';
import logger from '@/utils/logger';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  CheckCircle2,
  ChevronRight,
  Download,
  Info,
  Loader2,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
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

/**
 * Loading placeholder shaped like the section cards below it. Widths are
 * passed as complete class strings because NativeWind only extracts static
 * class names.
 */
const SectionCardSkeleton = ({
  headerClass,
  lineClass,
  rows,
}: {
  headerClass: string;
  lineClass: string;
  rows: number;
}) => (
  <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
    <View className="relative flex-row items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
      <View
        className={['h-5', headerClass, 'rounded', 'bg-zinc-200'].join(' ')}
      />
      <View className="h-4 w-24 rounded bg-zinc-200" />
    </View>
    <View className="p-2">
      {Array.from({ length: rows }, (_, index) => (
        <View key={index}>
          <View className="flex-row items-center rounded-xl px-4 py-2">
            <View className="h-7 w-7 rounded-lg bg-zinc-100" />
            <View className="ml-3 flex-1">
              <View
                className={[
                  'mb-2 h-4',
                  lineClass,
                  'rounded',
                  'bg-zinc-100',
                ].join(' ')}
              />
              <View className="h-3 w-16 rounded bg-zinc-100" />
            </View>
          </View>
          {index < rows - 1 && <View className="mx-4 h-px bg-zinc-50" />}
        </View>
      ))}
    </View>
  </View>
);

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
              <View className="ml-3 mr-2 flex-1">
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

  // API data state
  const [pdfs, setPdfs] = useState<PdfDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Shared alert dialog and PDF download/library logic
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  const {
    downloadedPdfs,
    downloadingIds,
    downloadedIds,
    refresh: refreshDownloaded,
    download,
    viewRemote,
    selectedDownloadedPdf,
    sheetRef,
    openSheet,
    viewSelected,
    shareSelected,
    removeSelected,
  } = usePdfDownloads({ showAlert });

  // Fetch data from backend API
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const pdfsResponse = await getPdfs({ page: 1, limit: 20 });
        setPdfs(pdfsResponse.data);

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

  // Refresh state and function
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Fetch PDFs from API
      const pdfsResponse = await getPdfs({ page: 1, limit: 20 });
      setPdfs(pdfsResponse.data);

      // Re-read the local download library so state matches disk
      await refreshDownloaded();

      logger.success('Resources refreshed successfully');
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to refresh resources';
      logger.error(`Error refreshing resources: ${errorMessage}`);
    } finally {
      setRefreshing(false);
    }
  }, [refreshDownloaded]);

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
            contentContainerStyle={{ paddingBottom: 32 }}
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
                  <SectionCardSkeleton
                    headerClass="w-32"
                    lineClass="w-3/4"
                    rows={3}
                  />
                  <SectionCardSkeleton
                    headerClass="w-40"
                    lineClass="w-4/5"
                    rows={2}
                  />
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
                    onPress: () => void viewRemote(pdf.pdfUrl, pdf.title),
                    size: `${(pdf.size / 1024).toFixed(0)} KB`,
                  }))}
                  onDownload={item =>
                    void download({
                      documentId: item.documentId,
                      title: item.label,
                      // The card only carries a display label, so it doubles
                      // as the stored file name and the size arrives as KB.
                      pdfName: item.label,
                      pdfUrl: item.pdfUrl,
                      size:
                        parseInt(item.size?.replace(/[^0-9]/g, '') || '0', 10) *
                        1024,
                    })
                  }
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
                    onPress: () => openSheet(pdf),
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
          <BottomFade />
        </SafeAreaView>
      </LinearGradient>

      <CustomBottomSheetModal ref={sheetRef}>
        <View className="flex-1 p-4">
          {selectedDownloadedPdf ? (
            <DownloadedPdfInfo
              title={selectedDownloadedPdf.title}
              location={selectedDownloadedPdf.localUri}
              size={`${(selectedDownloadedPdf.size / 1024).toFixed(0)} KB`}
              date={new Date(
                selectedDownloadedPdf.downloadedAt
              ).toLocaleDateString()}
              onView={viewSelected}
              onShare={shareSelected}
              onRemove={removeSelected}
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
