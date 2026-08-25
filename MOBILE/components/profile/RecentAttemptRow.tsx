import { AppIcon } from '@/components/global/AppIcon';
import { colors } from '@/constants/colors';
import { RecentAttempt } from '@/types';
import { CheckCircle2 } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

/**
 * One row in a recent quizzes list: score pill, title, completion date.
 * Styled like the content cards: white, bordered, soft shadow.
 * Shared by the profile card and the recent quizzes screen.
 */
export const RecentAttemptRow = ({ attempt }: { attempt: RecentAttempt }) => (
  <View className="mb-3 flex-row items-center rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg">
    <View
      className={`mr-3 items-center justify-center rounded-xl px-2.5 py-1.5 ${
        attempt.score === attempt.total && attempt.total > 0
          ? 'bg-green-100'
          : 'bg-zinc-100'
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
    {attempt.score === attempt.total && attempt.total > 0 && (
      <AppIcon
        Icon={CheckCircle2}
        size={18}
        strokeWidth={2}
        color={colors.green[600]}
      />
    )}
  </View>
);
