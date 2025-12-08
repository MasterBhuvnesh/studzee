import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, View } from 'react-native';

interface OnboardingScreenProps {
  title: string;
  description: string;
  gradientColors: string[];
  imageSource?: any; // Can be require() or URI string for jpg, png, svg, gif
}

export default function OnboardingScreen({
  title,
  description,
  gradientColors,
  imageSource,
}: OnboardingScreenProps) {
  return (
    <LinearGradient
      colors={gradientColors as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1 items-center justify-center px-8"
    >
      <View className="w-full max-w-md items-center">
        {imageSource && (
          <Image
            source={imageSource}
            className="mb-8 h-48 w-48"
            contentFit="contain"
          />
        )}
        <Text className="mb-6 text-center font-product-bold text-4xl text-white">
          {title}
        </Text>
        <Text className="text-center font-product text-lg leading-7 text-white/90">
          {description}
        </Text>
      </View>
    </LinearGradient>
  );
}
