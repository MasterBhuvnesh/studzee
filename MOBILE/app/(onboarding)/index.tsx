import OnboardingScreen from '@/components/onboarding/OnboardingScreen';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    title: 'Welcome to Studzee',
    description:
      'Your personal learning companion for achieving academic excellence',
    gradientColors: ['#9333ea', '#ec4899'], // purple to pink
    imageSource: require('@/assets/images/folder.jpeg'),
  },
  {
    id: '2',
    title: 'Track Your Progress',
    description:
      'Monitor your learning journey with detailed analytics and insights',
    gradientColors: ['#0ea5e9', '#06b6d4'], // blue to cyan
    imageSource: {
      uri: 'https://i.pinimg.com/1200x/05/67/36/056736be4bfbb6ff83c68eb8a1667b9b.jpg',
    },
  },
  {
    id: '3',
    title: 'Ready to Begin?',
    description:
      'Join thousands of students transforming their study experience',
    gradientColors: ['#f97316', '#ef4444'], // orange to red
    imageSource: undefined,
  },
];

export default function OnboardingFlow() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/(auth)/sign-in');
  };

  const handleDone = async () => {
    await completeOnboarding();
    router.replace('/(auth)/sign-in');
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
      />

      {/* Navigation Controls */}
      <View className="absolute bottom-0 left-0 right-0 px-8 pb-12">
        {/* Pagination Dots */}
        <View className="mb-8 flex-row items-center justify-center gap-2">
          {onboardingData.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${
                index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/40'
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
              >
                <Text className="font-product text-base text-white">Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNext}
                className="rounded-lg bg-white px-8 py-3"
              >
                <Text className="font-product-bold text-base text-zinc-900">
                  Next
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={handleDone}
              className="w-full rounded-lg bg-white py-4"
            >
              <Text className="text-center font-product-bold text-base text-zinc-900">
                Get Started
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
