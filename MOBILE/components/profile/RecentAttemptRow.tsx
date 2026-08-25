import { AppIcon } from '@/components/global/AppIcon';
import { colors } from '@/constants/colors';
import { RecentAttempt } from '@/types';
import { CheckCircle2 } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface RecentAttemptRowProps {
  attempt: RecentAttempt;
  /**
   * compact: the subtle zinc row used inline on the profile card.
   * card: the white shadow card used on the recent quizzes screen.
   */
  variant?: 'compact' | 'card';
}

/**
 * One row in a recent quizzes list: score pill, title, completion date.
 * Shared by the profile card and the recent quizzes screen.
 */
export const RecentAttemptRow = ({
  attempt,
  variant = 'compact',
}: RecentAttemptRowProps) => {
  const isPerfect = attempt.score === attempt.total && attempt.total > 0;

  if (variant === 'card') {
    return (
      <View className="mb-3 flex-row items-center rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg">
        <View
          className={`mr-3 items-center justify-center rounded-xl px-2.5 py-1.5 ${
            isPerfect ? 'bg-green-100' : 'bg-zinc-100'
          }`}
        >
          <Text className="font-product text-sm text-zinc-800">
            {attempt.score}/{attempt.total}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="font-sans text-base text-zinc-800" numberOfLines={1}>
            {attempt.title || 'Quiz'}
          </Text>
          <Text className="mt-0.5 font-sans text-xs text-zinc-400">
            {new Date(attempt.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {isPerfect && (
          <AppIcon
            Icon={CheckCircle2}
            size={18}
            strokeWidth={2}
            color={colors.green[600]}
          />
        )}
      </View>
    );
  }

  return (
    <View className="mb-2 flex-row items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
      <View
        className={`items-center justify-center rounded-lg px-2 py-1 ${
          isPerfect ? 'bg-green-100' : 'bg-zinc-200'
        }`}
      >
        <Text className="font-product text-xs text-zinc-700">
          {attempt.score}/{attempt.total}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-sans text-sm text-zinc-800" numberOfLines={1}>
          {attempt.title || 'Quiz'}
        </Text>
        <Text className="font-sans text-xs text-zinc-400">
          {new Date(attempt.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
};
