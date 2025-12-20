import { colors } from '@/constants/colors';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
  }[];
  onDismiss?: () => void;
}

export function CustomAlert({
  visible,
  title,
  message,
  buttons,
  onDismiss,
}: CustomAlertProps) {
  const handleButtonPress = (onPress?: () => void) => {
    onPress?.();
    onDismiss?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Content */}
          <View className="px-6 pb-4 pt-6">
            <Text className="mb-3 text-center font-product text-xl text-zinc-800">
              {title}
            </Text>
            <Text className="text-center font-sans text-base leading-6 text-zinc-500">
              {message}
            </Text>
          </View>

          {/* Buttons */}
          <View className="flex-row border-t border-zinc-200">
            {buttons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              const isLast = index === buttons.length - 1;

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleButtonPress(button.onPress)}
                  className="flex-1 items-center justify-center py-3.5"
                  style={{
                    borderRightWidth: isLast ? 0 : 1,
                    borderRightColor: colors.zinc[200],
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    className="font-sans text-base"
                    style={{
                      color: isDestructive
                        ? colors.red[600]
                        : isCancel
                          ? colors.zinc[500]
                          : colors.blue[500],
                    }}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
