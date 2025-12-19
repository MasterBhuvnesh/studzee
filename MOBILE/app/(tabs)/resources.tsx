// We will be required to save the pdfs in the device storage and a json for the info too
import { AppIcon } from '@/components/global/AppIcon';
import CustomBottomSheetModal from '@/components/global/CustomBottomSheetModal';
import { DownloadedPdfInfo } from '@/components/global/DownloadedPdfInfo';
import { Header } from '@/components/global/Header';
import { colors } from '@/constants/colors';
import { getPdfs } from '@/lib/api';
import {
  DownloadedCardProps,
  PdfDocument,
  PdfItem,
  ResourceCardProps,
} from '@/types';
import logger from '@/utils/logger';
import { useAuth } from '@clerk/clerk-expo';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Download, Info } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ResourceCard = ({ title, items }: ResourceCardProps) => (
  <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
    <View className="relative flex-row items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
      <Text className="font-product text-base text-zinc-800">{title}</Text>
      <TouchableOpacity className="flex-row items-center gap-1">
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
      {items.map((item, index) => (
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
              onPress={() => {
                logger.debug(`Download PDF: ${item.label}`);
              }}
              className="ml-2 rounded-lg p-2 active:bg-zinc-100"
              activeOpacity={0.7}
            >
              <AppIcon
                Icon={Download}
                color={colors.zinc[500]}
                size={20}
                strokeWidth={1.5}
              />
            </TouchableOpacity>
          </View>
          {index < items.length - 1 && (
            <View className="mx-4 h-px bg-zinc-100" />
          )}
        </View>
      ))}
    </View>
  </View>
);

const DownloadedCard = ({ title, items }: DownloadedCardProps) => (
  <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
    <View className="relative flex-row items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
      <Text className="font-product text-base text-zinc-800">{title}</Text>
      <TouchableOpacity className="flex-row items-center gap-1">
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
  const { getToken } = useAuth();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [selectedPdf, setSelectedPdf] = useState<PdfItem | null>(null);

  // API data state
  const [pdfs, setPdfs] = useState<PdfDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from backend API
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch PDFs only
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

  const openDownloadedPdf = useCallback((item: PdfItem) => {
    setSelectedPdf(item);
    // give the ref a touch, present should exist on the forwarded ref
    bottomSheetRef.current?.present?.();
  }, []);

  const closeBottomSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss?.();
    setSelectedPdf(null);
  }, []);

  return (
    <>
      <LinearGradient
        colors={[colors.zinc[50], colors.zinc[100]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="flex-1"
      >
        <SafeAreaView className="flex-1 bg-transparent">
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
                    onPress: () => {
                      logger.debug(`PDF pressed: ${pdf.title}`);
                      // TODO: Handle PDF opening/downloading
                    },
                    size: `${(pdf.size / 1024).toFixed(0)} KB`,
                  }))}
                />
              )}

              {/* Downloaded PDFs (keeping as is for now - local storage feature) */}
              <DownloadedCard
                title="Downloaded PDFs"
                items={[
                  {
                    label: 'Feature engineering for Machine Learning in python',
                    // now calls the open function with item data
                    onPress: () =>
                      openDownloadedPdf({
                        label:
                          'Feature engineering for Machine Learning in python',
                        size: '5 mb',
                        date: '2025-12-12',
                        location: '/storage/emulated/0/Documents',
                        path: '/storage/emulated/0/Documents/feature_engineering.pdf',
                        icon: Info,
                      }),
                    size: '5 mb',
                    icon: Info,
                  },
                  {
                    label: 'Data Visualization with matplotlib',
                    onPress: () =>
                      openDownloadedPdf({
                        label: 'Data Visualization with matplotlib',
                        size: '15 mb',
                        date: '2025-12-12',
                        location: '/storage/emulated/0/Documents',
                        path: '/storage/emulated/0/Documents/data_viz_matplotlib.pdf',
                        icon: Info,
                      }),
                    size: '15 mb',
                    icon: Info,
                  },
                ]}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      <CustomBottomSheetModal ref={bottomSheetRef}>
        <View className="flex-1 p-4">
          {/* If selectedPdf is null show a minimal fallback or empty state */}
          {selectedPdf ? (
            <DownloadedPdfInfo
              title={selectedPdf.label}
              location={selectedPdf.location ?? 'Unknown location'}
              size={selectedPdf.size ?? '—'}
              date={selectedPdf.date ?? '—'}
              onView={() =>
                logger.debug(`View PDF pressed: ${selectedPdf.label}`)
              }
              onShare={() =>
                logger.debug(`Share PDF pressed: ${selectedPdf.label}`)
              }
              onRemove={() => {
                logger.debug(`Remove PDF pressed: ${selectedPdf.label}`);
                closeBottomSheet();
              }}
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
    </>
  );
}
