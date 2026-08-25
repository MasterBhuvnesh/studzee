import { AppIcon } from '@/components/global/AppIcon';
import { colors } from '@/constants/colors';
import { Check } from 'lucide-react-native';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';

interface AchievementCelebrationModalProps {
  visible: boolean;
  /** Bundled require() source or a remote uri, resolved by the caller */
  imageSource: number | { uri: string };
  /** Small label above the name, for example Badge Unlocked */
  eyebrow: string;
  title: string;
  subtitle: string;
  onClose: () => void;
}

/**
 * Achievement moment in the reference style: a centred card floating on a
 * dimmed, transparent backdrop rather than a full screen takeover. The
 * backdrop stays see through so the screen the user was on stays visible
 * underneath.
 */
export const AchievementCelebrationModal = ({
  visible,
  imageSource,
  eyebrow,
  title,
  subtitle,
  onClose,
}: AchievementCelebrationModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/60 px-8">
        <View className="w-full max-w-sm items-center rounded-3xl bg-white px-8 pb-8 pt-10 shadow-2xl">
          <View className="mb-6 h-32 w-32 items-center justify-center">
            <Image
              source={imageSource}
              style={{ width: 128, height: 128 }}
              contentFit="contain"
            />
          </View>

          <Text className="mb-1 font-sans text-xs uppercase tracking-widest text-zinc-400">
            {eyebrow}
          </Text>
          <Text className="text-center font-product text-2xl text-zinc-900">
            {title}
          </Text>
          <Text className="mt-2 text-center font-sans text-sm leading-5 text-zinc-500">
            {subtitle}
          </Text>

          <TouchableOpacity
            onPress={onClose}
            className="mt-8 w-full flex-row items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3.5 active:bg-zinc-700"
            activeOpacity={0.8}
          >
            <AppIcon Icon={Check} size={16} color="#ffffff" />
            <Text className="font-product text-base text-white">Awesome</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
