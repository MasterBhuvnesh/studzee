import { AppIcon } from '@/components/global/AppIcon';
import CustomBottomSheetModal from '@/components/global/CustomBottomSheetModal';
import { FactModal } from '@/components/global/FactModal';
import { colors } from '@/constants/colors';
import { getContentById } from '@/lib/api';
import { downloadPdf } from '@/lib/download';
import { ContentDetail } from '@/types';
import logger from '@/utils/logger';
import { useAuth } from '@clerk/clerk-expo';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Download,
  Eye,
  Lightbulb,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// ============ COMPONENTS ============

/**
 * Loading skeleton for content detail
 */
const ContentDetailSkeleton = () => {
  return (
    <View className="px-6">
      {/* Image skeleton */}
      <View className="mb-6 h-48 w-full rounded-2xl bg-zinc-200" />

      {/* Title skeleton */}
      <View className="mb-2 h-8 w-3/4 rounded bg-zinc-200" />
      <View className="mb-6 h-8 w-1/2 rounded bg-zinc-200" />

      {/* Meta info skeleton */}
      <View className="mb-6 h-4 w-32 rounded bg-zinc-200" />

      {/* Content skeleton */}
      <View className="gap-2 space-x-1">
        <View className="h-16 w-full rounded bg-zinc-200" />
        <View className="h-8 w-1/2 rounded bg-zinc-200" />
        <View className="h-8 w-2/3 rounded bg-zinc-200" />
      </View>
    </View>
  );
};

/**
 * Error state component
 */
const ErrorState = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <View className="w-full overflow-hidden rounded-2xl border border-red-200 bg-red-50 p-6">
        <Text className="font-product text-base text-red-800">
          Error Loading Content
        </Text>
        <Text className="mt-2 font-sans text-sm text-red-600">{error}</Text>
        <TouchableOpacity
          onPress={onRetry}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 active:bg-red-700"
          activeOpacity={0.8}
        >
          <Text className="text-center font-sans text-sm text-white">
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============ MAIN COMPONENT ============

export default function ContentDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken } = useAuth();
  const keyNotesSheetRef = useRef<BottomSheetModal>(null);

  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [factsModalVisible, setFactsModalVisible] = useState(false);
  const [downloadingPdfIndex, setDownloadingPdfIndex] = useState<number | null>(
    null
  );

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get auth token from Clerk
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required. Please sign in.');
      }

      logger.info(`Fetching content detail for ID: ${id}`);
      const contentDetail = await getContentById(id as string, token);
      setContent(contentDetail);
      logger.success('Content detail loaded successfully');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load content';
      setError(errorMessage);
      logger.error(`Error loading content: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchContent();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleViewPdf = async (pdfUrl: string, pdfName: string) => {
    try {
      logger.info(`Opening PDF in browser: ${pdfName}`);
      await WebBrowser.openBrowserAsync(pdfUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        controlsColor: colors.zinc[700],
        toolbarColor: colors.zinc[50],
      });
    } catch (error) {
      logger.error(`Failed to open PDF: ${error}`);
    }
  };

  const handleDownloadPdf = async (
    pdfUrl: string,
    pdfName: string,
    pdfSize: number,
    index: number
  ) => {
    if (!content) return;

    try {
      setDownloadingPdfIndex(index);
      logger.info(`Downloading PDF: ${pdfName}`);

      const result = await downloadPdf(
        content._id,
        content.title,
        pdfName,
        pdfUrl,
        pdfSize
      );

      if (result.success) {
        logger.success('PDF downloaded successfully');
        // You could show a success toast here
      } else {
        logger.error(`Download failed: ${result.error}`);
        // You could show an error toast here
      }
    } catch (error) {
      logger.error(`Failed to download PDF: ${error}`);
    } finally {
      setDownloadingPdfIndex(null);
    }
  };

  return (
    <LinearGradient
      colors={[colors.zinc[50], colors.zinc[100]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center gap-3 px-6 pb-4 pt-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="rounded-full p-2 active:bg-zinc-200"
            activeOpacity={0.7}
          >
            <AppIcon
              Icon={ArrowLeft}
              color={colors.zinc[700]}
              size={24}
              strokeWidth={2}
            />
          </TouchableOpacity>
          <Text className="flex-1 font-product text-xl text-zinc-800">
            Overview
          </Text>
          {/* Key Notes Icon Button */}
          {content?.key_notes && Object.keys(content.key_notes).length > 0 && (
            <TouchableOpacity
              onPress={() => keyNotesSheetRef.current?.present()}
              className="rounded-full p-2 active:bg-zinc-100"
              activeOpacity={0.7}
            >
              <AppIcon
                Icon={BookOpen}
                color={colors.zinc[500]}
                size={20}
                strokeWidth={1.5}
              />
            </TouchableOpacity>
          )}
          {/* Facts Icon Button */}
          {content?.facts && (
            <TouchableOpacity
              onPress={() => setFactsModalVisible(true)}
              className="rounded-full p-2 active:bg-zinc-100"
              activeOpacity={0.7}
            >
              <AppIcon
                Icon={Lightbulb}
                color={colors.zinc[500]}
                size={20}
                strokeWidth={1.5}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {loading ? (
            <ContentDetailSkeleton />
          ) : error ? (
            <ErrorState error={error} onRetry={fetchContent} />
          ) : content ? (
            <View className="px-6 pb-8">
              {/* Image */}
              {content.imageUrl && (
                <Image
                  source={{ uri: content.imageUrl }}
                  className="mb-6 w-full rounded-2xl"
                  contentFit="cover"
                  style={{
                    width: '100%',
                    height: 200,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                />
              )}

              {/* Title */}
              <Text className="mb-4 text-center font-product text-3xl text-zinc-800">
                {content.title}
              </Text>

              {/* Meta Information */}
              <View className="mb-6 mt-2 flex-row items-center gap-4">
                <View className="flex-row items-center gap-1">
                  <AppIcon
                    Icon={Calendar}
                    color={colors.zinc[500]}
                    size={16}
                    strokeWidth={1.5}
                  />
                  <Text className="font-sans text-base text-zinc-500">
                    {formatDate(content.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Main Content */}
              <View className="mb-6 border-t border-zinc-200 pt-4">
                {/* <Text className="mb-3 font-product text-xl text-zinc-800">
                  Content
                </Text> */}
                <Text className="font-sans text-base leading-7 text-zinc-700">
                  {content.content}
                </Text>
              </View>

              <View className="mb-6 border-t border-zinc-200 pb-6 pt-4">
                <Text className="mb-3 font-product text-xl text-zinc-800">
                  Summary
                </Text>
                <View className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6">
                  <View className="items-center">
                    <Text className="font-sans text-base text-zinc-500">
                      {content.summary}
                    </Text>
                  </View>
                </View>
              </View>
              {/* PDFs */}
              {content.pdfUrl && content.pdfUrl.length > 0 && (
                <View className="mb-6 border-t border-zinc-200 pt-4">
                  <Text className="mb-3 font-product text-xl text-zinc-800">
                    Resources
                  </Text>
                  {content.pdfUrl.map((pdf, index) => (
                    <View
                      key={index}
                      className="mb-3 flex-row items-center overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4"
                    >
                      {/* PDF Icon and Info */}
                      <View className="flex-1 flex-row items-center gap-3">
                        <Image
                          source={require('@/assets/images/pdf.svg')}
                          style={{ width: 28, height: 28 }}
                          contentFit="contain"
                        />
                        <View className="flex-1">
                          <Text className="font-sans text-sm font-medium text-zinc-800">
                            {pdf.name}
                          </Text>
                          <Text className="mt-0.5 font-sans text-xs text-zinc-500">
                            {(pdf.size / 1024).toFixed(2)} KB
                          </Text>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View className="ml-2 flex-row gap-2">
                        {/* View Button */}
                        <TouchableOpacity
                          onPress={() => handleViewPdf(pdf.url, pdf.name)}
                          className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 active:bg-zinc-100"
                          activeOpacity={0.7}
                        >
                          <AppIcon
                            Icon={Eye}
                            color={colors.zinc[600]}
                            size={18}
                            strokeWidth={1.5}
                          />
                        </TouchableOpacity>

                        {/* Download Button */}
                        <TouchableOpacity
                          onPress={() =>
                            handleDownloadPdf(
                              pdf.url,
                              pdf.name,
                              pdf.size,
                              index
                            )
                          }
                          disabled={downloadingPdfIndex === index}
                          className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 active:bg-zinc-100"
                          activeOpacity={0.7}
                        >
                          {downloadingPdfIndex === index ? (
                            <View
                              style={{ width: 18, height: 18 }}
                              className="items-center justify-center"
                            >
                              <Text className="font-sans text-xs text-zinc-500">
                                ...
                              </Text>
                            </View>
                          ) : (
                            <AppIcon
                              Icon={Download}
                              color={colors.zinc[600]}
                              size={18}
                              strokeWidth={1.5}
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Quiz Section - Coming Soon */}
              {content.quiz && Object.keys(content.quiz).length > 0 && (
                <View className="mb-6">
                  <Text className="mb-3 font-product text-xl text-zinc-800">
                    Quiz
                  </Text>
                  <View className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6">
                    <View className="items-center">
                      <Text className="font-sans text-sm text-zinc-500">
                        Quiz feature coming soon!
                      </Text>
                      <Text className="mt-1 font-sans text-xs text-zinc-400">
                        {Object.keys(content.quiz).length} questions available
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      {/* Key Notes Bottom Sheet */}
      <CustomBottomSheetModal ref={keyNotesSheetRef}>
        <View className="flex-1 px-4 pb-4">
          <Text className="mb-4 font-product text-xl text-zinc-800">
            Key Notes
          </Text>
          {content?.key_notes && (
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              {Object.entries(content.key_notes).map(([key, value], index) => (
                <View
                  key={key}
                  className="mb-3 rounded-2xl border border-zinc-200 bg-white px-6 py-4"
                >
                  <Text className="font-sans text-base leading-7 text-zinc-700">
                    {value}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </CustomBottomSheetModal>

      {/* Facts Modal */}
      <FactModal
        visible={factsModalVisible}
        title="Interesting Facts"
        message={content?.facts || ''}
        onDismiss={() => setFactsModalVisible(false)}
      />
    </LinearGradient>
  );
}
