import { AppIcon } from '@/components/global/AppIcon';
import { RecentAttemptRow } from '@/components/profile/RecentAttemptRow';
import { colors } from '@/constants/colors';
import { getMyProgress } from '@/lib/api';
import type { MyProgress } from '@/types';
import logger from '@/utils/logger';
import { useAuth } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Full history of the caller's recent quiz attempts. The profile card shows
 * the first few; this screen shows everything the progress endpoint returns.
 */
export default function RecentQuizzesScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [progress, setProgress] = useState<MyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // getToken is read through a ref: Clerk does not keep it referentially
  // stable, and keying the effect on it directly loops requests.
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const inFlight = useRef(false);

  const fetchProgress = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      setLoading(true);
      setError(null);

      const token = await getTokenRef.current();
      if (!token) {
        throw new Error('Authentication required. Please sign in.');
      }

      setProgress(await getMyProgress(token));
      logger.success('Recent quizzes loaded');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load quizzes';
      setError(message);
      logger.error(`Error loading recent quizzes: ${message}`);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProgress();
  }, [fetchProgress]);

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
            Recent Quizzes
          </Text>
        </View>

        {loading ? (
          <View className="px-6 pt-2">
            {[1, 2, 3, 4].map(index => (
              <View
                key={index}
                className="mb-2 h-16 rounded-xl border border-zinc-200 bg-white px-4 py-3"
              >
                <View className="h-4 w-2/3 rounded bg-zinc-100" />
                <View className="mt-2 h-3 w-1/3 rounded bg-zinc-100" />
              </View>
            ))}
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-full rounded-2xl border border-red-200 bg-red-50 p-6">
              <Text className="font-product text-base text-red-800">
                Error Loading Quizzes
              </Text>
              <Text className="mt-2 font-sans text-sm text-red-600">
                {error}
              </Text>
              <TouchableOpacity
                onPress={fetchProgress}
                className="mt-4 rounded-xl bg-red-600 px-4 py-2 active:bg-red-700"
                activeOpacity={0.8}
              >
                <Text className="text-center font-sans text-sm text-white">
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : progress && progress.recentAttempts.length > 0 ? (
          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
          >
            {progress.recentAttempts.map(attempt => (
              <RecentAttemptRow
                variant="card"
                key={`${attempt.contentId}-${attempt.createdAt}`}
                attempt={attempt}
              />
            ))}
            <View className="h-8" />
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-full items-center rounded-2xl border border-zinc-200 bg-white p-8">
              <Text className="font-product text-lg text-zinc-800">
                No Quizzes Yet
              </Text>
              <Text className="mt-2 text-center font-sans text-sm text-zinc-500">
                Complete a quiz and your results will show up here.
              </Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}
