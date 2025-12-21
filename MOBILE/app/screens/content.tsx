import { AppIcon } from '@/components/global/AppIcon';
import { colors } from '@/constants/colors';
import { getContent } from '@/lib/api';
import { ContentSummary } from '@/types';
import logger from '@/utils/logger';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ============ COMPONENTS ============

/**
 * Individual content item in the list
 */
const ContentListItem = ({ item }: { item: ContentSummary }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => {
        logger.debug(`Content pressed: ${item.title}`);
        router.push({
          pathname: '/screens/[id]',
          params: { id: item.id },
        });
      }}
      className="mb-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 active:bg-zinc-50"
      activeOpacity={0.7}
    >
      <Text className="font-sans text-base text-zinc-800" numberOfLines={2}>
        {item.title}
      </Text>
      <Text className="mt-2 font-sans text-sm text-zinc-500" numberOfLines={3}>
        {item.summary}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Loading skeleton for content items
 */
const ContentListSkeleton = () => {
  return (
    <>
      {[1, 2, 3, 4, 5].map(index => (
        <View
          key={index}
          className="mb-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4"
        >
          <View className="h-5 w-3/4 rounded bg-zinc-200" />
          <View className="mt-2 h-4 w-full rounded bg-zinc-200" />
          <View className="mt-1 h-4 w-5/6 rounded bg-zinc-200" />
        </View>
      ))}
    </>
  );
};

// ============ MAIN COMPONENT ============

export default function ContentPage() {
  const router = useRouter();
  const [content, setContent] = useState<ContentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch initial content
  useEffect(() => {
    fetchContent(1);
  }, []);

  const fetchContent = async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const contentResponse = await getContent({ page: pageNum, limit: 20 });

      if (pageNum === 1) {
        setContent(contentResponse.data);
      } else {
        setContent(prev => [...prev, ...contentResponse.data]);
      }

      // Check if there are more pages
      const totalPages = Math.ceil(
        contentResponse.meta.total / (contentResponse.meta.limit || 20)
      );
      setHasMore(contentResponse.meta.page < totalPages);

      logger.success(`Content page ${pageNum} fetched successfully`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch content';
      setError(errorMessage);
      logger.error(`Error fetching content: ${errorMessage}`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchContent(nextPage);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color={colors.zinc[500]} />
      </View>
    );
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
          <Text className="font-product text-2xl text-zinc-800">
            Machine Learning
          </Text>
        </View>

        {/* Content List */}
        {loading ? (
          <View className="flex-1 px-6">
            <ContentListSkeleton />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <View className="overflow-hidden rounded-2xl border border-red-200 bg-red-50 p-6">
              <Text className="font-product text-base text-red-800">
                Error Loading Content
              </Text>
              <Text className="mt-2 font-sans text-sm text-red-600">
                {error}
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={content}
            renderItem={({ item }) => <ContentListItem item={item} />}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}
