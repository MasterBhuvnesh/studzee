import { AppIcon } from '@/components/global/AppIcon';
import { RecentQuizzesSection } from '@/components/profile/RecentQuizzesSection';
import { colors } from '@/constants/colors';
import type { BadgeStatus, MyProgress } from '@/types';
import { Award, ChevronRight, Flame, Lock } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const GEM = require('@/assets/images/gem.png');

interface GamificationCardProps {
  progress: MyProgress | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  /** How many recent quizzes to show inline; the rest live on their screen */
  recentLimit?: number;
}

/**
 * Share of the current level band already covered by the user's points
 */
const computeLevelPercent = (progress: MyProgress): number => {
  if (!progress.nextLevel) return 100;
  const floor = progress.level?.minPoints ?? 0;
  const span = progress.nextLevel.minPoints - floor;
  if (span <= 0) return 100;
  const percent = Math.round(((progress.points - floor) / span) * 100);
  return Math.min(Math.max(percent, 0), 100);
};

const LevelBar = ({ percent }: { percent: number }) => (
  <View className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
    <View
      className="h-full rounded-full bg-zinc-900"
      style={{ width: `${percent}%` }}
    />
  </View>
);

/**
 * Badge chips render every badge with its award state, earned ones colored
 * and unearned ones grayed out behind a lock so they still read as goals
 */
const BadgeChip = ({ badge }: { badge: BadgeStatus }) => (
  <View
    className={`mr-2 flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${
      badge.awarded
        ? 'border-amber-200 bg-amber-50'
        : 'border-zinc-200 bg-zinc-50'
    }`}
  >
    <AppIcon
      Icon={badge.awarded ? Award : Lock}
      size={13}
      strokeWidth={2}
      color={badge.awarded ? colors.amber[500] : colors.zinc[400]}
    />
    <Text
      className={`font-sans text-xs ${
        badge.awarded ? 'font-medium text-amber-700' : 'text-zinc-400'
      }`}
    >
      {badge.label}
    </Text>
  </View>
);

/**
 * Loading skeleton matching the card's layout
 */
const GamificationSkeleton = () => (
  <View className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg">
    <View className="mb-4 flex-row items-center justify-between">
      <View className="h-5 w-32 rounded bg-zinc-200" />
      <View className="h-5 w-16 rounded bg-zinc-200" />
    </View>
    <View className="mb-2 h-2 w-full rounded-full bg-zinc-200" />
    <View className="mb-6 h-3 w-40 rounded bg-zinc-200" />
    <View className="mb-4 h-px w-full rounded bg-zinc-200" />
    <View className="flex-row gap-2">
      <View className="h-7 flex-1 rounded-full bg-zinc-200" />
      <View className="h-7 w-24 rounded-full bg-zinc-200" />
    </View>
  </View>
);

export const GamificationCard = ({
  progress,
  loading,
  error,
  onRetry,
  recentLimit = 3,
}: GamificationCardProps) => {
  const router = useRouter();

  if (loading && !progress) {
    return <GamificationSkeleton />;
  }

  if (error && !progress) {
    return (
      <View className="mb-6 overflow-hidden rounded-2xl border border-red-200 bg-red-50 p-6">
        <Text className="font-product text-base text-red-800">
          Error Loading Progress
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
    );
  }

  if (!progress) {
    return null;
  }

  const percent = computeLevelPercent(progress);
  // allBadges carries the award state; fall back to the earned list alone
  // when the backend has not sent the full catalog yet
  const badges: BadgeStatus[] =
    progress.allBadges.length > 0
      ? progress.allBadges
      : progress.badges.map(badge => ({
          key: badge.key,
          label: badge.label,
          description: badge.description,
          threshold: 0,
          awarded: true,
        }));

  return (
    <View className="mb-6">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="font-product text-xl text-zinc-800">
          Your Progress
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/screens/achievements')}
          className="flex-row items-center gap-1 active:opacity-70"
          activeOpacity={0.7}
        >
          <Text className="font-sans text-sm text-zinc-500">Achievements</Text>
          <AppIcon
            Icon={ChevronRight}
            size={16}
            strokeWidth={2}
            color={colors.zinc[500]}
          />
        </TouchableOpacity>
      </View>

      <View className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
        <View className="p-6 pb-4">
          {/* Level and points */}
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              {progress.level?.imageUrl ? (
                <Image
                  source={{ uri: progress.level.imageUrl }}
                  style={{ width: 32, height: 32 }}
                  contentFit="contain"
                />
              ) : null}
              <View>
                <Text className="font-product text-lg text-zinc-800">
                  {progress.level?.label || 'No Level Yet'}
                </Text>
                <Text className="mt-0.5 font-sans text-sm text-zinc-500">
                  {progress.nextLevel
                    ? `${Math.max(progress.nextLevel.minPoints - progress.points, 0)} pts to ${progress.nextLevel.label}`
                    : 'Top level reached'}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-1.5">
              <Image
                source={GEM}
                style={{ width: 18, height: 18 }}
                contentFit="contain"
              />
              <Text className="font-product text-base text-zinc-800">
                {progress.points}
              </Text>
            </View>
          </View>

          {/* Progress toward next level */}
          <LevelBar percent={percent} />
          <Text className="mt-2 font-sans text-xs text-zinc-400">
            {percent}% to next level
          </Text>

          <View className="my-4 h-px w-full bg-zinc-200" />

          {/* Streak */}
          <View className="flex-row items-center gap-2">
            <AppIcon Icon={Flame} size={16} color={colors.orange[500]} />
            <Text className="font-sans text-sm text-zinc-600">
              {progress.streak.current} day streak
            </Text>
            <Text className="ml-auto font-sans text-xs text-zinc-400">
              Longest: {progress.streak.longest}
            </Text>
          </View>
        </View>

        {/* Badges */}
        {badges.length > 0 && (
          <View className="border-t border-zinc-200 p-6 pt-4">
            <Text className="mb-3 font-product text-sm text-zinc-800">
              Badges
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {badges.map(badge => (
                <BadgeChip key={badge.key} badge={badge} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent quizzes */}
        <RecentQuizzesSection
          attempts={progress.recentAttempts}
          limit={recentLimit}
        />
      </View>
    </View>
  );
};
