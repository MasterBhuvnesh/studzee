import { colors } from '@/constants/colors';
import logger from '@/utils/logger';
import { Image, ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ActionCardProps {
  title: string;
  description: string;
  buttonText: string;
  image: ImageSource;
  onPress?: () => void;
}

const ActionCard = ({
  title,
  description,
  buttonText,
  image,
  onPress,
}: ActionCardProps) => (
  <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
    <View className="flex-row items-center justify-between p-6">
      <View className="flex-1 pr-4">
        <Text className="mb-2 font-product text-base text-zinc-800">
          {title}
        </Text>
        <Text className="mb-4 font-sans text-base leading-5 text-zinc-500">
          {description}
        </Text>
        <TouchableOpacity
          onPress={onPress}
          className="self-start rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-2.5 shadow-sm"
          activeOpacity={0.7}
        >
          <Text className="font-product text-base text-zinc-700">
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>
      <View className="items-center justify-center">
        <Image
          source={image}
          style={{ width: 100, height: 100 }}
          className="rounded-lg"
        />
      </View>
    </View>
  </View>
);

export default function ProgressPage() {
  return (
    <LinearGradient
      colors={[colors.zinc[50], colors.zinc[100]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6 pt-6">
          <ActionCard
            title="Rapid Content Access"
            description="Redis caching ensures instant access to educational content, always available."
            buttonText="Explore Content"
            image={require('@/assets/images/sample/1.png')}
            onPress={() => logger.debug('Explore Content pressed')}
          />

          <ActionCard
            title="Smart Quiz System"
            description="Interactive quizzes with performance tracking and AI-generated learning assessments."
            buttonText="Test Knowledge"
            image={require('@/assets/images/sample/2.jpeg')}
            onPress={() => logger.debug('Test Knowledge pressed')}
          />

          <ActionCard
            title="Gamified Learning"
            description="Earn XP, unlock achievements, and compete on leaderboards while studying."
            buttonText="Start Earning"
            image={require('@/assets/images/sample/3.jpeg')}
            onPress={() => logger.debug('Start Earning pressed')}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
