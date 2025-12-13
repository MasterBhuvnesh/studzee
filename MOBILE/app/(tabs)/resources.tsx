// We will be required to save the pdfs in the device storage and a json for the info too
import { AppIcon } from '@/components/global/AppIcon';
import CustomBottomSheetModal from '@/components/global/CustomBottomSheetModal';
import { DownloadedPdfInfo } from '@/components/global/DownloadedPdfInfo';
import { Header } from '@/components/global/Header';
import { colors } from '@/constants/colors';
import { DownloadedCardProps, PdfItem, ResourceCardProps } from '@/types';
import logger from '@/utils/logger';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Info } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
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
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [selectedPdf, setSelectedPdf] = useState<PdfItem | null>(null);

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
              <ResourceCard
                title="Top 3 PDFs"
                items={[
                  {
                    label: 'Deep Learning for Images with pytorch',
                    onPress: () =>
                      logger.debug(
                        'Deep Learning for Images with pytorch pressed'
                      ),
                    size: '5 mb',
                  },
                  {
                    label: 'Natural language processing withSpacy',
                    onPress: () =>
                      logger.debug(
                        'Natural language processing withSpacy pressed'
                      ),
                    size: '15 mb',
                  },
                  {
                    label: 'Extreme Gradient Boosting with XGBoost',
                    onPress: () =>
                      logger.debug(
                        'Extreme Gradient Boosting with XGBoost pressed'
                      ),
                    size: '7 mb',
                  },
                ]}
              />

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
