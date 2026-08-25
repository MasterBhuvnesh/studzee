import { colors } from '@/constants/colors';
import React from 'react';
import { Text, View } from 'react-native';

/**
 * Small rounded chips for the freeform document tags. Capped so a card
 * never wraps: three chips fit comfortably beside two lines of summary.
 */
export const TagChips = ({
  tags,
  max = 3,
}: {
  tags: string[];
  max?: number;
}) => {
  if (!tags || tags.length === 0) return null;
  const shown = tags.slice(0, max);

  return (
    <View className="mt-2 flex-row flex-wrap gap-1.5">
      {shown.map(tag => (
        <View key={tag} className="rounded-full bg-zinc-100 px-2 py-0.5">
          <Text
            className="font-sans text-[10px] text-zinc-500"
            numberOfLines={1}
          >
            {tag}
          </Text>
        </View>
      ))}
    </View>
  );
};
