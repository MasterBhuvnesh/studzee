import { Content, EnrichedMarkdownText } from '@/components/content/contentmd';
import { AppIcon } from '@/components/global/AppIcon';
import CustomBottomSheetModal from '@/components/global/CustomBottomSheetModal';
import { CustomAlert } from '@/components/global/CustomAlert';
import { FactModal } from '@/components/global/FactModal';
import { colors } from '@/constants/colors';
import { getContentById, completeQuest, ApiError } from '@/lib/api';
import { addNotification } from '@/lib/inapp';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { usePdfDownloads } from '@/hooks/usePdfDownloads';
import { ContentDetail } from '@/types';
import logger from '@/utils/logger';
import { useAuth } from '@clerk/clerk-expo';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  Lock,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// ============ MARKDOWN RENDER SAMPLE, TEMPORARY ============
//
// Previews how react-native-enriched-markdown would render real markdown
// authored content, workstream 3 in the content and gamification plan
// (.docs/TCSK.md). contentmd.tsx's typed ContentSection blocks do not run
// markdown syntax through the parser at all, only `formula` blocks do
// (LaTeX), so this bypasses the real content fetch and feeds a raw markdown
// string straight to EnrichedMarkdownText with flavor="github" instead,
// which is the actual entry point a markdown based content model would use.
//
// Flip this back to false and this whole block becomes dead code the
// bundler drops, nothing else in the screen depends on it.
const SAMPLE_MODE = false;

const SAMPLE_MARKDOWN = `# Gradient Descent

An optimization algorithm used to minimize a **loss function** by
iteratively moving toward the direction of steepest descent, as defined by
the *negative* of the gradient.

## Update Rule

Each step nudges the parameters \`theta\` a little further downhill:

\`\`\`python
def step(theta, grad, lr=0.01):
    return theta - lr * grad
\`\`\`

## Variants

1. Batch gradient descent, the full dataset every step
2. Stochastic gradient descent, one sample every step
3. Mini-batch gradient descent, a small batch every step

Common pitfalls:

- Learning rate too high, the loss diverges
- Learning rate too low, training crawls
- Getting stuck in a [saddle point](https://en.wikipedia.org/wiki/Saddle_point)

> A learning rate that works for one architecture rarely transfers cleanly
> to another. Tune it per model, not once for the project.

| Variant     | Update frequency | Noise level |
| ----------- | ----------------- | ----------- |
| Batch       | Once per epoch     | Low         |
| Stochastic  | Once per sample    | High        |
| Mini-batch  | Once per batch     | Medium      |

![Loss surface, gradient descent converging toward the minimum](https://placehold.co/600x300/png?text=Loss+Surface+Diagram)
`;

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

/**
 * Points gated document. Retry cannot help here: the caller earns the
 * missing points by completing quizzes elsewhere and returns later.
 */
const LockedState = ({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) => {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <View className="w-full items-center rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg">
        <View className="mb-4 rounded-full bg-zinc-100 p-3">
          <AppIcon
            Icon={Lock}
            color={colors.zinc[400]}
            size={22}
            strokeWidth={1.5}
          />
        </View>
        <Text className="font-product text-lg text-zinc-800">
          Content Locked
        </Text>
        <Text className="mt-2 text-center font-sans text-sm leading-5 text-zinc-500">
          {message}
        </Text>
        <TouchableOpacity
          onPress={onBack}
          className="mt-6 rounded-xl bg-zinc-900 px-6 py-3 active:bg-zinc-700"
          activeOpacity={0.8}
        >
          <Text className="text-center font-sans text-sm font-medium text-white">
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Animated quiz illustration component
 */
const QuizIllustration = () => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite repeat
      true // Reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle} className="items-end justify-center">
      <View className="gap-1.5">
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-6 rounded bg-zinc-100" />
          <View className="h-2 w-16 rounded-full bg-zinc-100" />
        </View>
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-6 rounded bg-zinc-100" />
          <View className="h-2 w-20 rounded-full bg-zinc-200" />
        </View>
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-6 rounded bg-zinc-100" />
          <View className="h-2 w-12 rounded-full bg-zinc-100" />
        </View>
      </View>
    </Animated.View>
  );
};

// ============ MAIN COMPONENT ============

export default function ContentDetailPage() {
  const router = useRouter();
  const { id, questId } = useLocalSearchParams<{
    id: string;
    questId?: string;
  }>();
  const { getToken } = useAuth();
  const keyNotesSheetRef = useRef<BottomSheetModal>(null);

  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code?: string } | null>(
    null
  );
  const [factsModalVisible, setFactsModalVisible] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  // Shared alert dialog and PDF download/library logic. This screen renders
  // the same Resources rows as the rest of the app and now shares their
  // downloaded state instead of ignoring it.
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  const { downloadingIds, downloadedUrls, download, viewRemote } =
    usePdfDownloads({ showAlert });

  // Read a blog quest: when opened from a quest, reaching the end of the
  // document claims it. The ref keeps the claim to one attempt per mount.
  const questClaimedRef = useRef(false);
  const claimReadQuest = async (quest: string) => {
    if (questClaimedRef.current) return;
    questClaimedRef.current = true;
    try {
      const token = await getToken();
      if (!token) return;

      const result = await completeQuest(token, quest, { read: true });
      if (result.passed) {
        logger.success(
          `Read quest completed: +${result.gemsAwarded ?? 0} gems`
        );
        void addNotification(
          'Quest Complete',
          `You finished the reading quest and earned ${result.gemsAwarded ?? 0} gems.`
        );
        showAlert(
          'Quest Complete',
          `You read it to the end and earned ${result.gemsAwarded ?? 0} gems.`,
          [{ text: 'Nice', style: 'default' }]
        );
      }
    } catch (err) {
      logger.warn(`Read quest claim failed: ${err}`);
      questClaimedRef.current = false;
    }
  };

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);

      if (SAMPLE_MODE) {
        logger.info('SAMPLE_MODE on, skipping the real content fetch');
        setContent({
          _id: id as string,
          title: 'Gradient Descent',
          content: [],
          quiz: {},
          facts: '',
          summary: 'Sample content for previewing markdown rendering.',
          key_notes: {},
          imageUrl: '',
          pdfUrl: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __v: 0,
          tags: [],
        });
        return;
      }

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
      const message =
        err instanceof Error ? err.message : 'Failed to load content';
      const code = err instanceof ApiError ? err.code : undefined;
      setError({ message, code });
      logger.error(`Error loading content: ${message}`);
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

  return (
    <>
      <LinearGradient
        colors={[colors.zinc[50], colors.zinc[100]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="flex-1"
      >
        <SafeAreaView className="mb-10 flex-1">
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

            {/* WILL HANDLE LATER */}
            {/* Key Notes Icon Button */}
            {/* {content?.key_notes && Object.keys(content.key_notes).length > 0 && (
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
          )} */}
            {/* Facts Icon Button */}
            {/* {content?.facts && (
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
          )} */}
          </View>

          {/* Content */}
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
              const { contentOffset, layoutMeasurement, contentSize } =
                event.nativeEvent;
              const scrollProgress =
                contentOffset.y /
                (contentSize.height - layoutMeasurement.height);
              const percentage = Math.min(
                Math.max(Math.round(scrollProgress * 100), 0),
                100
              );
              setReadProgress(percentage);

              // Read a blog quest: reaching the end proves the read. Guarded
              // to loaded content so scrolling a skeleton cannot claim it.
              if (
                questId &&
                percentage >= 95 &&
                !loading &&
                !error &&
                content
              ) {
                void claimReadQuest(questId as string);
              }
            }}
            scrollEventThrottle={16}
          >
            {loading ? (
              <ContentDetailSkeleton />
            ) : error ? (
              error.code === 'CONTENT_LOCKED' ? (
                <LockedState
                  message={error.message}
                  onBack={() => router.back()}
                />
              ) : (
                <ErrorState error={error.message} onRetry={fetchContent} />
              )
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
                  {SAMPLE_MODE ? (
                    <EnrichedMarkdownText
                      flavor="github"
                      markdown={SAMPLE_MARKDOWN}
                    />
                  ) : (
                    <Content content={content.content} />
                  )}
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
                    {content.pdfUrl.map((pdf, index) => {
                      // Metadata keeps the source URL, so rows show per-file
                      // state even though storage is keyed by document and one
                      // document can hold several PDFs.
                      const isDownloading = downloadingIds.includes(
                        content._id
                      );
                      const isDownloaded = downloadedUrls.includes(pdf.url);

                      return (
                        <View
                          key={index}
                          className="mb-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5"
                        >
                          {/* PDF Icon and Info */}
                          <View className="flex-row items-center gap-3">
                            <View className="h-12 w-12 items-center justify-center rounded-xl">
                              <Image
                                source={require('@/assets/images/pdf.svg')}
                                style={{ width: 24, height: 24 }}
                                contentFit="contain"
                              />
                            </View>
                            <View className="flex-1">
                              <Text
                                className="font-sans text-sm font-medium text-zinc-800"
                                numberOfLines={2}
                              >
                                {pdf.name}
                              </Text>
                              <Text className="mt-1 self-start rounded-full bg-zinc-100 px-2 py-0.5 font-sans text-xs text-zinc-500">
                                {(pdf.size / 1024).toFixed(2)} KB
                              </Text>
                            </View>
                          </View>

                          {/* Action Buttons */}
                          <View className="mt-4 flex-row gap-2">
                            <TouchableOpacity
                              onPress={() => void viewRemote(pdf.url, pdf.name)}
                              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 active:bg-blue-100"
                              activeOpacity={0.7}
                            >
                              <AppIcon
                                Icon={Eye}
                                color={colors.blue[600]}
                                size={18}
                                strokeWidth={1.5}
                              />
                              <Text className="font-sans text-sm font-medium text-blue-500">
                                View
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() =>
                                void download({
                                  documentId: content._id,
                                  title: content.title,
                                  pdfName: pdf.name,
                                  pdfUrl: pdf.url,
                                  size: pdf.size,
                                })
                              }
                              disabled={isDownloading}
                              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 active:bg-zinc-100"
                              activeOpacity={0.7}
                            >
                              <AppIcon
                                Icon={
                                  isDownloading
                                    ? Loader2
                                    : isDownloaded
                                      ? CheckCircle2
                                      : Download
                                }
                                color={
                                  isDownloaded && !isDownloading
                                    ? colors.green[600]
                                    : colors.zinc[600]
                                }
                                size={18}
                                strokeWidth={1.5}
                              />
                              <Text className="font-sans text-sm font-medium text-zinc-500">
                                {isDownloading
                                  ? 'Downloading...'
                                  : isDownloaded
                                    ? 'Downloaded'
                                    : 'Download'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Quiz Section */}
                {content.quiz && Object.keys(content.quiz).length > 0 && (
                  <View className="mb-20">
                    <Text className="mb-3 font-product text-xl text-zinc-800">
                      Quiz
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        logger.info('Starting quiz');
                        router.push({
                          pathname: '/screens/quiz',
                          params: {
                            quiz: JSON.stringify(content.quiz),
                            contentTitle: content.title,
                            contentId: content._id,
                          },
                        });
                      }}
                      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5"
                      activeOpacity={0.8}
                    >
                      <View className="flex-row items-center">
                        {/* Left Content */}
                        <View className="flex-1 pr-4">
                          <Text className="mb-1 font-product text-lg text-zinc-800">
                            Test Your Knowledge
                          </Text>
                          <Text className="mb-4 font-sans text-sm leading-5 text-zinc-500">
                            Challenge yourself with questions from this topic
                          </Text>
                          <View className="self-start rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5">
                            <Text className="font-product text-sm text-zinc-700">
                              Start Quiz
                            </Text>
                          </View>
                        </View>

                        {/* Right Illustration - Animated */}
                        {/* <QuizIllustration /> */}
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : null}
          </ScrollView>

          {/* Reading Progress Indicator with Gradient Fade */}
          {!loading && !error && content && (
            <View
              className="absolute bottom-0 left-0 right-0"
              pointerEvents="box-none"
            >
              <LinearGradient
                colors={[
                  'transparent',
                  'rgba(244, 244, 245, 0.8)',
                  colors.zinc[100],
                ]}
                locations={[0, 0.5, 1]}
                className="items-center pb-6 pt-16"
              >
                <View className="flex-row items-center rounded-full bg-zinc-900 px-4 py-2 shadow-lg">
                  <View
                    className="mr-2 h-4 w-4 items-center justify-center rounded-full border-2 border-zinc-400"
                    style={{
                      borderColor:
                        readProgress > 0 ? colors.zinc[400] : colors.zinc[600],
                    }}
                  >
                    {readProgress >= 100 && (
                      <View className="h-2 w-2 rounded-full bg-zinc-400" />
                    )}
                  </View>
                  <Text className="font-product text-sm text-white">
                    {readProgress}% read
                  </Text>
                </View>
              </LinearGradient>
            </View>
          )}
        </SafeAreaView>

        {/* Key Notes Bottom Sheet */}
        <CustomBottomSheetModal ref={keyNotesSheetRef}>
          <View className="flex-1 px-4 pb-4">
            <Text className="mb-4 font-product text-xl text-zinc-800">
              Key Notes
            </Text>
            {content?.key_notes && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                className="flex-1"
              >
                {Object.entries(content.key_notes).map(
                  ([key, value], index) => (
                    <View
                      key={key}
                      className="mb-3 rounded-2xl border border-zinc-200 bg-white px-6 py-4"
                    >
                      <Text className="font-sans text-base leading-7 text-zinc-700">
                        {value}
                      </Text>
                    </View>
                  )
                )}
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
