import { AppIcon } from '@/components/global/AppIcon';
import { Header } from '@/components/global/Header';
import { colors } from '@/constants/colors';
import { getContent } from '@/lib/api';
import { ContentSummary } from '@/types';
import logger from '@/utils/logger';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomePage() {
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

  return (
    <LinearGradient
      colors={[colors.zinc[50], colors.zinc[100]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <Header title="Home" />
        <ScrollView className="flex-1 px-6 pt-6">
          {/* Loading State */}
          {loading && (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color={colors.zinc[600]} />
              <Text className="mt-4 font-sans text-sm text-zinc-500">
                Loading content...
              </Text>
            </View>
          )}

          {/* Error State */}
          {error && !loading && (
            <View className="mb-6 overflow-hidden rounded-2xl border border-red-200 bg-red-50 p-6">
              <Text className="font-product text-base text-red-800">
                Error Loading Content
              </Text>
              <Text className="mt-2 font-sans text-sm text-red-600">
                {error}
              </Text>
            </View>
          )}

          {/* Content from API */}
          {!loading && !error && content.length > 0 && (
            <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
              <View className="relative flex-row items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                <Text className="font-product text-base text-zinc-800">
                  Available Content
                </Text>
                <TouchableOpacity className="flex-row items-center gap-1">
                  <Text className="font-sans text-sm text-zinc-500">
                    View All
                  </Text>
                  <AppIcon
                    Icon={ChevronRight}
                    color={colors.zinc[500]}
                    size={16}
                    strokeWidth={1.5}
                  />
                </TouchableOpacity>
              </View>
              <View className="p-2">
                {content.slice(0, 3).map((item, index) => (
                  <View key={item.id}>
                    <TouchableOpacity
                      onPress={async () => {
                        logger.debug(`Content pressed: ${item.title}`);
                        // TODO: Navigate to content detail page with item.id
                      }}
                      className="rounded-xl px-4 py-3 active:bg-zinc-50"
                      activeOpacity={0.7}
                    >
                      <Text
                        className="font-sans text-base text-zinc-700"
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                      <Text
                        className="mt-1 font-sans text-xs text-zinc-400"
                        numberOfLines={2}
                      >
                        {item.summary}
                      </Text>
                    </TouchableOpacity>
                    {index < content.slice(0, 3).length - 1 && (
                      <View className="mx-4 h-px bg-zinc-100" />
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
