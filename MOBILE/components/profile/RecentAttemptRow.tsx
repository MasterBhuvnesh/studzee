import { RecentAttempt } from '@/types';
import React from 'react';
import { Text, View } from 'react-native';

/**
 * One row in a recent quizzes list: score pill, title, completion date.
 * Shared by the profile card and the recent quizzes screen.
 */
export const RecentAttemptRow = ({ attempt }: { attempt: RecentAttempt }) => (
  <View className="mb-2 flex-row items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
    <View
      className={`items-center justify-center rounded-lg px-2 py-1 ${
        attempt.score === attempt.total && attempt.total > 0
          ? 'bg-green-100'
          : 'bg-zinc-200'
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
