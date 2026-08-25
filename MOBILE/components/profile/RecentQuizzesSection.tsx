import { AppIcon } from '@/components/global/AppIcon';
import { RecentAttemptRow } from '@/components/profile/RecentAttemptRow';
import { colors } from '@/constants/colors';
import { RecentAttempt } from '@/types';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface RecentQuizzesSectionProps {
  attempts: RecentAttempt[];
  /** How many rows to show inline before pointing at the full screen */
  limit: number;
}

/**
 * The Recent Quizzes block inside the gamification card: a few compact rows
 * plus a View All link to the full history screen.
 */
export const RecentQuizzesSection = ({
  attempts,
  limit,
}: RecentQuizzesSectionProps) => {
  const router = useRouter();

  if (attempts.length === 0) {
    return null;
  }

  return (
    <View className="border-t border-zinc-200 p-6 pt-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-product text-sm text-zinc-800">
          Recent Quizzes
        </Text>
        {attempts.length > limit && (
          <TouchableOpacity
            onPress={() => router.push('/screens/recent-quizzes')}
            className="flex-row items-center gap-1 active:opacity-70"
            activeOpacity={0.7}
          >
            <Text className="font-sans text-xs text-zinc-500">View All</Text>
            <AppIcon
              Icon={ChevronRight}
              size={13}
              strokeWidth={2}
              color={colors.zinc[500]}
            />
          </TouchableOpacity>
        )}
      </View>
      {attempts.slice(0, limit).map(attempt => (
        <RecentAttemptRow
          key={`${attempt.contentId}-${attempt.createdAt}`}
          attempt={attempt}
        />
      ))}
    </View>
  );
};
