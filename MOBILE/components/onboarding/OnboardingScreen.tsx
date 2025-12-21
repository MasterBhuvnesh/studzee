import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, View } from 'react-native';

import { OnboardingScreenProps } from '@/types';
import { StatusBar } from 'expo-status-bar';

export default function OnboardingScreen({
  title,
  description,
  gradientColors,
  imageSource,
}: OnboardingScreenProps) {
  return (
    <>
      <StatusBar style="dark" />
      <LinearGradient
        colors={gradientColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="flex-1 items-center justify-center px-8 "
      >
        <View className="w-full max-w-md items-center ">
          <Image
            source={imageSource}
            className="mb-8"
            contentFit="contain"
            blurRadius={0.5}
            style={{
              width: 300,
              height: 300,
            }}
          />
          <Text className="m-8 pb-2 text-center font-sans text-3xl text-zinc-900">
            {title}
          </Text>
          <Text className="mb-4 py-2 text-center font-sans text-base leading-7 text-zinc-700">
            {description}
          </Text>
        </View>
      </LinearGradient>
    </>
  );
}
