import { colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResourcesPage() {
  return (
    <LinearGradient
      colors={[colors.zinc[50], colors.zinc[100]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1 bg-transparent">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 pt-6">
            <Text className="py-2 font-product text-4xl text-zinc-900">
              Resources
            </Text>
          </View>
          <View className="px-6 pb-8 pt-6">
            <Text className="py-6 font-sans text-base text-zinc-500">
              Welcome to the resources section! Find comprehensive materials,
              including topic-specific cheat sheets and other downloadable PDF
              documents, to support your learning and work.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
