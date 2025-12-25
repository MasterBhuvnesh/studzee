import { colors } from '@/constants/colors';
import { X } from 'lucide-react-native';
import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export interface FactModalProps {
  visible: boolean;
  title?: string;
  message: string;
  onDismiss?: () => void;
}

export function FactModal({
  visible,
  title,
  message,
  onDismiss,
}: FactModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        className="flex-1 items-center justify-center bg-black/50 px-6"
        activeOpacity={1}
        onPress={onDismiss}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={e => e.stopPropagation()}
          className="w-full max-w-sm"
        >
          <View className="w-full overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Close Button */}
            <TouchableOpacity
              onPress={onDismiss}
              className="absolute right-4 top-4 z-10 rounded-full bg-zinc-100 p-2 active:bg-zinc-200"
              activeOpacity={0.7}
            >
              <X color={colors.zinc[600]} size={20} strokeWidth={2} />
            </TouchableOpacity>

            {/* Content */}
            <ScrollView
              className="max-h-96"
              showsVerticalScrollIndicator={false}
            >
              <View className="px-6 pb-6 pt-6">
                {title && (
                  <Text className="mb-3 pr-8 text-center font-product text-xl text-zinc-800">
                    {title}
                  </Text>
                )}
                <Text className="text-center font-sans text-base leading-6 text-zinc-500">
                  {message}
                </Text>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
