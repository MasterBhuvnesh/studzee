import { AppIcon } from '@/components/global/AppIcon';
import { Header } from '@/components/global/Header';
import { colors } from '@/constants/colors';
import { DownloadedCardProps, ResourceCardProps } from '@/types/components';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Info } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ResourceCard = ({ title, items }: ResourceCardProps) => (
  <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
    <View className="relative flex-row items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
      <Text className="font-product text-base text-zinc-800">{title}</Text>
      <TouchableOpacity className="flex-row items-center gap-1">
        <Text className="font-sans text-sm text-zinc-500">View All PDFs</Text>
        <AppIcon
          Icon={ChevronRight}
          color={colors.zinc[500]}
          size={16}
          strokeWidth={1.5}
        />
      </TouchableOpacity>
    </View>
    <View className="p-2">
      {items.map((item, index) => (
        <View key={index}>
          <TouchableOpacity
            onPress={item.onPress}
            className="flex-row items-center justify-between rounded-xl px-4 py-2 active:bg-zinc-50"
            activeOpacity={0.7}
          >
            <View className="flex-1 flex-row items-center">
              <Image
                source={require('@/assets/images/pdf.svg')}
                style={{ width: 26, height: 26 }}
                className="rounded-lg"
              />
              <View className="ml-3 flex-1">
                <Text
                  className="font-sans text-base text-zinc-500"
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
                <Text className="py-1 font-sans text-xs text-zinc-400">
                  {item.size}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          {index < items.length - 1 && (
            <View className="mx-4 h-px bg-zinc-100" />
          )}
        </View>
      ))}
    </View>
  </View>
);
const DownloadedCard = ({ title, items }: DownloadedCardProps) => (
  <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
    <View className="relative flex-row items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
      <Text className="font-product text-base text-zinc-800">{title}</Text>
      <TouchableOpacity className="flex-row items-center gap-1">
        <Text className="font-sans text-sm text-zinc-500">View All PDFs</Text>
        <AppIcon
          Icon={ChevronRight}
          color={colors.zinc[500]}
          size={16}
          strokeWidth={1.5}
        />
      </TouchableOpacity>
    </View>
    <View className="p-2">
      {items.map((item, index) => (
        <View key={index}>
          <TouchableOpacity
            onPress={item.onPress}
            className="flex-row items-center justify-between rounded-xl px-4 py-2 active:bg-zinc-50"
            activeOpacity={0.7}
          >
            <View className="flex-1 flex-row items-center">
              <Image
                source={require('@/assets/images/pdf.svg')}
                style={{ width: 26, height: 26 }}
                className="rounded-lg"
              />
              <View className="ml-3 flex-1">
                <Text
                  className="font-sans text-base text-zinc-500"
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
                <Text className="py-1 font-sans text-xs text-zinc-400">
                  {item.size}
                </Text>
              </View>
              <AppIcon
                Icon={item.icon}
                color={colors.zinc[500]}
                size={16}
                strokeWidth={1.5}
              />
            </View>
          </TouchableOpacity>
          {index < items.length - 1 && (
            <View className="mx-4 h-px bg-zinc-100" />
          )}
        </View>
      ))}
    </View>
  </View>
);

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
          <Header title="Resources" />
          <View className="px-6 pb-8 pt-6">
            <ResourceCard
              title="Top 3 PDFs"
              items={[
                {
                  label: 'Deep Learning for Images with pytorch',
                  onPress: () =>
                    console.log('Deep Learning for Images with pytorch'),
                  size: '5 mb',
                },
                {
                  label: 'Natural language processing withSpacy',
                  onPress: () =>
                    console.log('Natural language processing withSpacy'),
                  size: '15 mb',
                },
                {
                  label: 'Extreme Gradient Boosting with XGBoost',
                  onPress: () =>
                    console.log('Extreme Gradient Boosting with XGBoost'),
                  size: '7 mb',
                },
              ]}
            />
            <DownloadedCard
              title="Downloaded PDFs"
              items={[
                {
                  label: 'Feature engineering for Machine Learning in python',
                  onPress: () =>
                    console.log(
                      'Feature engineering for Machine Learning in python'
                    ),
                  size: '5 mb',
                  icon: Info,
                },
                {
                  label: 'Data Visualization with matplotlib',
                  onPress: () =>
                    console.log('Data Visualization with matplotlib'),
                  size: '15 mb',
                  icon: Info,
                },
              ]}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
