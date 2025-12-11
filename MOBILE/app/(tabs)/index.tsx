import { Header } from '@/components/global/Header';
import { colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomePage() {
  return (
    <LinearGradient
      colors={[colors.zinc[50], colors.zinc[100]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <Header title="Home" />
        <ScrollView className="flex-1 px-6 pt-6">
          <Text className="text-center font-sans text-base text-zinc-500">
            Machine learning is all about making predictions based on data.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
