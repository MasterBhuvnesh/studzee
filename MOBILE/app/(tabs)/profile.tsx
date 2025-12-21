import { Header } from '@/components/global/Header';
import { colors } from '@/constants/colors';
import { ProfileCardProps } from '@/types';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileCard = ({
  name,
  email,
  buttonText,
  image,
  onPress,
}: ProfileCardProps) => (
  <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
    <View className="flex-row items-center  p-6">
      <View className="flex-1 pr-2">
        <Text className="mb-2 font-product text-base text-zinc-800">
          {name}
        </Text>
        <Text className="mb-4 font-sans text-base leading-5 text-zinc-500">
          {email}
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
          style={{ width: 80, height: 80, borderRadius: 50 }}
          className="rounded-lg"
        />
      </View>
    </View>
  </View>
);

export default function ProfilePage() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const getTokenAndLog = async () => {
    const token = await getToken();
    console.log('User Token:', token);
  };
  return (
    <>
      <LinearGradient
        colors={[colors.zinc[50], colors.zinc[100]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          <Header title="Profile" />
          <ScrollView className="flex-1 px-6 pt-6">
            <ProfileCard
              name={user?.fullName || 'User'}
              email={user?.emailAddresses[0]?.emailAddress || 'User'}
              buttonText="View Token"
              image={
                user?.imageUrl ||
                require('@/assets/images/onboarding/AI-Powered Concept Mastery.png')
              }
              onPress={() => getTokenAndLog()}
            />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}
