import { AppIcon } from '@/components/global/AppIcon';
import { Header } from '@/components/global/Header';
import { PlanningList } from '@/components/profile/PlanningList';
import { colors } from '@/constants/colors';
import { ProfileCardProps } from '@/types';
import { useLogTokenDev } from '@/utils/jwt.dev';
import { useUser } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Key, Link, TriangleAlertIcon } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ExtendedProfileCardProps extends ProfileCardProps {
  onEditBio?: () => void;
}

const ProfileCard = ({
  name,
  bio,
  email,
  buttonText,
  image,
  onPress,
  onEditBio,
}: ExtendedProfileCardProps) => (
  <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
    <View className="flex-row items-center gap-4 px-4 pt-4">
      <Image
        source={image}
        className="h-24 w-24 rounded-full"
        style={{ width: 100, height: 100, borderRadius: 50 }}
      />
      <View className="flex-1 gap-0.5">
        <Text className="font-product text-base text-zinc-800">{name}</Text>
        <Text className="font-sans text-sm leading-5 text-zinc-600">{bio}</Text>
      </View>
    </View>

    <View className="p-6">
      <View className="mb-4 flex-row items-center gap-2">
        <AppIcon Icon={Link} size={16} color={colors.zinc[500]} />
        <Text className="font-sans text-sm leading-5 text-zinc-500">
          {email}
        </Text>
      </View>
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          onPress={onPress}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-2.5 shadow-sm"
          activeOpacity={0.7}
        >
          <Text className="font-product text-base text-zinc-700">
            {buttonText}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onEditBio}
          className="flex-row items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 shadow-sm"
          activeOpacity={0.7}
        >
          <Text className="font-product text-base text-zinc-700">Edit Bio</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

export default function ProfilePage() {

  const { user } = useUser();
  const router = useRouter();
  const logToken = useLogTokenDev();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
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
            bio={(user?.unsafeMetadata?.bio as string) || 'Studzee.in'}
            email={user?.emailAddresses[0]?.emailAddress || 'User'}
            buttonText="Edit Profile"
            image={
              user?.imageUrl ||
              require('@/assets/images/onboarding/AI-Powered Concept Mastery.png')
            }
            onPress={() => router.push('/screens/edit-profile')}
            onEditBio={() => router.push('/screens/edit-bio')}
          />

          <PlanningList />

          {process.env.NODE_ENV !== 'production' && (
            <View className="flex-row items-center justify-center">
            <TouchableOpacity
              onPress={logToken}
              className="flex-row items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 shadow-sm"
              activeOpacity={0.7}
            >
              <AppIcon Icon={Key} size={16} color={colors.zinc[500]} />
              <Text className="font-product text-base text-zinc-700">Log Token</Text>
            </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
