import { AppIcon } from '@/components/global/AppIcon';
import { colors } from '@/constants/colors';
import { getContent } from '@/lib/api';
import { ContentSummary } from '@/types';
import logger from '@/utils/logger';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight, Lock } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ============ COMPONENTS ============

/**
 * Loading skeleton component displayed while content is being fetched
 */
const LoadingState = () => {
  return (
    <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
      <View className="relative flex-row items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
        <View className="h-5 w-40 rounded bg-zinc-200" />
        <View className="h-4 w-20 rounded bg-zinc-200" />
      </View>
      <View className="p-2">
        {[1, 2, 3].map(index => (
          <View key={index}>
            <View className="rounded-xl px-4 py-3">
              <View className="mb-2 h-4 w-4/5 rounded bg-zinc-200" />
              <View className="mt-1 h-3 w-full rounded bg-zinc-200" />
              <View className="mt-1 h-3 w-3/4 rounded bg-zinc-200" />
            </View>
            {index < 3 && <View className="mx-4 h-px bg-zinc-100" />}
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * Error state component displayed when content fetching fails
 */
const ErrorState = ({ error }: { error: string }) => {
  return (
    <View className="mb-6 overflow-hidden rounded-2xl border border-red-200 bg-red-50 p-6">
      <Text className="font-product text-base text-red-800">
        Error Loading Content
      </Text>
      <Text className="mt-2 font-sans text-sm text-red-600">{error}</Text>
    </View>
  );
};

/**
 * Locked content section for upcoming content
 */
const LockedContentSection = ({ title }: { title: string }) => {
  return (
    <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
      <View className="relative flex-row items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
        <Text className="font-product text-base text-zinc-800">{title}</Text>
        <View className="rounded-full bg-zinc-100 px-3 py-1">
          <Text className="font-sans text-xs text-zinc-600">Coming Soon</Text>
        </View>
      </View>
      <View className="flex items-center justify-center py-8">
        <View className="rounded-full bg-zinc-100 p-6">
          <AppIcon
            Icon={Lock}
            color={colors.zinc[400]}
            size={28}
            strokeWidth={1.5}
          />
        </View>
        <Text className="mt-4 font-sans text-sm text-zinc-500">
          This content will be available soon
        </Text>
      </View>
    </View>
  );
};

/**
 * Individual content card component
 */
const ContentCard = ({
  item,
  showDivider,
  onPress,
}: {
  item: ContentSummary;
  showDivider: boolean;
  onPress?: () => void;
}) => {
  return (
    <View>
      <TouchableOpacity
        onPress={onPress}
        className="rounded-xl px-4 py-3 active:bg-zinc-50"
        activeOpacity={0.7}
      >
        <Text className="font-sans text-base text-zinc-800" numberOfLines={2}>
          {item.title}
        </Text>
        <Text
          className="mt-1 font-sans text-sm text-zinc-500"
          numberOfLines={2}
        >
          {item.summary}
        </Text>
      </TouchableOpacity>
      {showDivider && <View className="mx-4 h-px bg-zinc-100" />}
    </View>
  );
};

/**
 * Section component that displays a category of content with header and items
 */
const ContentSection = ({
  title,
  content,
  onViewAll,
  router,
}: {
  title: string;
  content: ContentSummary[];
  onViewAll?: () => void;
  router: any;
}) => {
  const displayedContent = content.slice(0, 2);

  return (
    <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
      {/* Section Header */}
      <View className="relative flex-row items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
        <Text className="font-product text-base text-zinc-800">{title}</Text>
        <TouchableOpacity
          className="flex-row items-center gap-1"
          onPress={onViewAll}
        >
          <Text className="font-sans text-sm text-zinc-500">View All</Text>
          <AppIcon
            Icon={ChevronRight}
            color={colors.zinc[500]}
            size={16}
            strokeWidth={1.5}
          />
        </TouchableOpacity>
      </View>

      {/* Content List */}
      <View className="p-2">
        {displayedContent.map((item, index) => (
          <ContentCard
            key={item.id}
            item={item}
            showDivider={index < displayedContent.length - 1}
            onPress={() => {
              logger.debug(`Content pressed: ${item.title}`);
              router.push({
                pathname: '/screens/[id]',
                params: { id: item.id },
              });
            }}
          />
        ))}
      </View>
    </View>
  );
};

// ============ MAIN COMPONENT ============

export default function HomePage() {
  const router = useRouter();
  const [content, setContent] = useState<ContentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch content from backend API
  useEffect(() => {
    async function fetchContent() {
      try {
        setLoading(true);
        setError(null);

        const contentResponse = await getContent({ page: 1, limit: 20 });
        setContent(contentResponse.data);
        logger.success('Content fetched successfully for home page');
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch content';
        setError(errorMessage);
        logger.error(`Error fetching content: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, []);

  const handleViewAll = () => {
    logger.debug('View All pressed - navigating to content page');
    router.push('/screens/content');
  };

  return (
    <LinearGradient
      colors={[colors.zinc[50], colors.zinc[100]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6 pt-6">
          {/* Loading State */}
          {loading && <LoadingState />}

          {/* Error State */}
          {error && !loading && <ErrorState error={error} />}

          {/* Content Section */}
          {!loading && !error && content.length > 0 && (
            <ContentSection
              title="Machine Learning"
              content={content}
              onViewAll={handleViewAll}
              router={router}
            />
          )}

          {/* Locked/Upcoming Content Section */}
          {!loading && <LockedContentSection title="SQL" />}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
