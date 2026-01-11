import OnboardingScreen from '@/components/onboarding/OnboardingScreen';
import { colors } from '@/constants/colors';
import logger from '@/utils/logger';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const gradientColors = [
  '#FFFFFF',
  '#FFFFFF',
  '#FFFFFF',
  '#FFFFFF',
  colors.zinc[50],
  colors.zinc[100],
  colors.zinc[200],
];

const onboardingData = [
  {
    id: '1',
    title: 'Welcome to Studzee',
    description:
      'Your dedicated companion for academic excellence. Download study materials to ensure uninterrupted learning, even without an internet connection.',
    gradientColors,
    imageSource:
      'https://studzee-assets.s3.ap-south-1.amazonaws.com/assets/Welcome+to+Studzee.png',
  },
  {
    id: '2',
    title: 'AI-Powered Concept Mastery',
    description:
      'Master complex topics with AI-driven insights and interactive tools designed for deep understanding and long-term retention.',
    gradientColors,
    imageSource:
      'https://studzee-assets.s3.ap-south-1.amazonaws.com/assets/AI-Powered+Concept+Mastery.png',
  },
  {
    id: '3',
    title: 'Smart Study Reminders',
    description:
      'Stay consistent and never miss a study session with personalized notifications designed to keep you on track.',
    gradientColors,
    imageSource:
      'https://studzee-assets.s3.ap-south-1.amazonaws.com/assets/Smart+Study+Reminders.png',
  },
];

export default function OnboardingFlow() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const handleContinue = () => {
    if (isNavigating) return;

    setIsNavigating(true);
    logger.info('Navigating to sign-in...');
    router.push('/sign-in');
  };

  const handleSkip = () => {
    handleContinue();
  };

  const handleDone = () => {
    handleContinue();
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const renderItem = ({ item }: { item: (typeof onboardingData)[0] }) => (
    <View style={{ width }}>
      <OnboardingScreen
        title={item.title}
        description={item.description}
        gradientColors={item.gradientColors}
        imageSource={item.imageSource}
      />
    </View>
  );

  const isLastScreen = currentIndex === onboardingData.length - 1;

  return (
    <View className="flex-1">
      <StatusBar style="light" />

      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        scrollEnabled={!isNavigating}
      />

      {/* Navigation Controls */}
      <View className="absolute bottom-0 left-0 right-0 px-8 pb-12">
        {/* Pagination Dots */}
        <View className="mb-8 flex-row items-center justify-center gap-2">
          {onboardingData.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${
                index === currentIndex ? 'w-8 bg-zinc-600' : 'w-2 bg-zinc-300'
              }`}
            />
          ))}
        </View>

        {/* Buttons */}
        <View className="flex-row items-center justify-between">
          {!isLastScreen ? (
            <>
              <TouchableOpacity
                onPress={handleSkip}
                className="rounded-lg px-6 py-3"
                disabled={isNavigating}
              >
                <Text className="font-product text-base text-zinc-700">
                  {isNavigating ? 'Loading...' : 'Skip'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNext}
                disabled={isNavigating}
                className="self-start rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-2.5 shadow-sm"
                activeOpacity={0.7}
              >
                <Text className="font-product text-base text-zinc-700">
                  Next
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={handleDone}
              className="self-start rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-2.5"
              disabled={isNavigating}
              activeOpacity={0.7}
            >
              {isNavigating ? (
                <ActivityIndicator color={colors.zinc[600]} />
              ) : (
                <Text className="text-center font-product text-base text-zinc-700">
                  Get Started
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
