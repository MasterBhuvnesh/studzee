// TODO : icons and user profile
import { SignOutButton } from '@/components';
import { colors } from '@/constants/colors';
import { useUser } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SettingCardProps {
  title: string;
  items: { label: string; onPress?: () => void }[];
}

const SettingCard = ({ title, items }: SettingCardProps) => (
  <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
    <View className="border-b border-zinc-100 bg-zinc-50 px-6 py-4">
      <Text className="font-product text-base text-zinc-800">{title}</Text>
    </View>
    <View className="p-2">
      {items.map((item, index) => (
        <View>
          <TouchableOpacity
            key={index}
            onPress={item.onPress}
            className="flex-row items-center justify-between rounded-xl px-4 py-2 active:bg-zinc-50"
            activeOpacity={0.7}
          >
            {/* <Bell color={colors.zinc[500]} size={16} strokeWidth={1.5} /> */}
            <Text className="font-sans text-base text-zinc-500">
              {item.label}
            </Text>
            <ChevronRight
              color={colors.zinc[500]}
              size={16}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
          {index < items.length - 1 && (
            <View className="mx-4 h-px bg-zinc-100" />
          )}
        </View>
      ))}
    </View>
  </View>
);

// interface ProfileInfoItemProps {
//   label: string;
//   value: string;
// }

// const ProfileInfoItem = ({ label, value }: ProfileInfoItemProps) => (
//   <View className="rounded-xl bg-zinc-50 p-4">
//     <Text className="mb-1 font-product text-xs text-zinc-500">{label}</Text>
//     <Text className="font-product text-sm text-zinc-900" numberOfLines={1}>
//       {value}
//     </Text>
//   </View>
// );

export default function SettingsPage() {
  const { user } = useUser();

  return (
    <LinearGradient
      colors={[colors.zinc[50], colors.zinc[100]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1 bg-transparent">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 pb-8 pt-6">
            {/* 
            // Profile Card
            <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
              <View className="items-center bg-gradient-to-b from-zinc-50 to-white px-6 pb-6 pt-8">
                {user?.imageUrl ? (
                  <Image
                    source={{ uri: user.imageUrl }}
                    className="mb-4 h-24 w-24 rounded-full border-4 border-white shadow-md"
                  />
                ) : (
                  <View className="mb-4 h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-zinc-900 shadow-md">
                    <Text className="font-product-bold text-4xl text-white">
                      {user?.firstName?.charAt(0) ||
                        user?.emailAddresses[0]?.emailAddress?.charAt(0) ||
                        'U'}
                    </Text>
                  </View>
                )}

                <Text className="mb-1 font-product-bold text-2xl text-zinc-900">
                  {user?.firstName || 'User'} {user?.lastName || ''}
                </Text>
                <Text className="font-product text-base text-zinc-600">
                  {user?.emailAddresses[0]?.emailAddress}
                </Text>
              </View>

              <View className="gap-3 border-t border-zinc-100 p-4">
                <ProfileInfoItem label="Account ID" value={user?.id || 'N/A'} />
                <ProfileInfoItem
                  label="Account Created"
                  value={
                    user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'
                  }
                />
                {user?.phoneNumbers && user.phoneNumbers.length > 0 && (
                  <ProfileInfoItem
                    label="Phone Number"
                    value={user.phoneNumbers[0].phoneNumber}
                  />
                )}
              </View>
            </View> */}

            {/* Experience Settings */}
            <SettingCard
              title="Experience"
              items={[
                {
                  label: 'App Notifications',
                  onPress: () => console.log('App Notifications'),
                },
                {
                  label: 'Language',
                  onPress: () => console.log('Language'),
                },
                {
                  label: 'Newsletters',
                  onPress: () => console.log('Newsletters'),
                },
              ]}
            />

            {/* Support Settings */}
            <SettingCard
              title="Support"
              items={[
                {
                  label: 'Get Support',
                  onPress: () => console.log('Get Support'),
                },
                {
                  label: 'Send Feedback',
                  onPress: () => console.log('Send Feedback'),
                },
                {
                  label: 'Terms of Use',
                  onPress: () => console.log('Terms of Use'),
                },
                {
                  label: 'Privacy Policy',
                  onPress: () => console.log('Privacy Policy'),
                },
              ]}
            />

            {/* Account Settings */}
            <SettingCard
              title="Account"
              items={[
                {
                  label: 'Change Password',
                  onPress: () => console.log('Change Password'),
                },
              ]}
            />

            {/* Sign Out Button */}
            <SignOutButton />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
