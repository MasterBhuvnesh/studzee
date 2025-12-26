import { AppIcon } from '@/components/global/AppIcon';
import { Header } from '@/components/global/Header';
import { colors } from '@/constants/colors';
import { ProfileCardProps } from '@/types';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { TriangleAlertIcon } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileCard = ({
  name,
  email,
  buttonText,
  image,
  onPress,
}: ProfileCardProps) => (
  <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
    <View className="flex-row items-center justify-between pl-4 pr-4 pt-4">
      <Image
        source={image}
        className="h-24 w-24 rounded-full "
        style={{ width: 100, height: 100, borderRadius: 50 }}
      />

      <Image
        source="https://studzee-assets.s3.ap-south-1.amazonaws.com/assets/verified.png"
        className="rounded-full"
        style={{
          width: 140,
          height: 80,
          marginRight: 20,
        }}
        alt="Verified"
      />
    </View>

    <View className="p-6">
      <Text className="mb-2 font-product text-base text-zinc-800">{name}</Text>
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
  </View>
);

export default function ProfilePage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);

  const getTokenAndLog = async () => {
    const token = await getToken();
    console.log('User Token:', token);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // The user object will automatically refresh from Clerk
      // You can add any additional refresh logic here if needed
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for better UX
    } finally {
      setRefreshing(false);
    }
  }, []);

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
          <ScrollView
            className="flex-1 px-6 pt-6"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.zinc[800]]}
                tintColor={colors.zinc[800]}
              />
            }
          >
            {!user?.fullName && (
              <View className="mb-6 overflow-hidden rounded-2xl border border-orange-200 bg-orange-50 shadow-lg">
                <View className="p-6">
                  <View className="mb-2 flex-row items-center gap-3">
                    <AppIcon
                      Icon={TriangleAlertIcon}
                      size={20}
                      color={colors.orange[500]}
                    />
                    <Text className="font-product text-base text-orange-800">
                      Complete Your Profile
                    </Text>
                  </View>
                  <Text className="mb-3 font-sans text-sm leading-5 text-orange-700">
                    Please edit your profile to add your full name and complete
                    your account setup.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/screens/edit-profile')}
                    className="self-start rounded-lg bg-orange-500 px-4 py-2 shadow-sm"
                    activeOpacity={0.7}
                  >
                    <Text className="font-product text-sm text-white">
                      Edit Profile Now
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <ProfileCard
              name={user?.fullName || 'User'}
              email={user?.emailAddresses[0]?.emailAddress || 'User'}
              buttonText="Edit Profile"
              image={
                user?.imageUrl ||
                require('@/assets/images/onboarding/AI-Powered Concept Mastery.png')
              }
              onPress={() => router.push('/screens/edit-profile')}
            />

            <TouchableOpacity
              onPress={getTokenAndLog}
              className="mb-6 rounded-lg bg-zinc-800 px-5 py-3 shadow-lg"
              activeOpacity={0.7}
            >
              <Text className="text-center font-product text-base text-white">
                Log Token to Console
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}
