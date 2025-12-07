import { useUser } from '@clerk/clerk-expo';
import { Text, View, ScrollView, Image } from 'react-native';
import { SignOutButton } from '@/components';

export default function ProfilePage() {
  const { user } = useUser();

  return (
    <View className="flex-1 bg-zinc-50">
      <ScrollView className="flex-1">
        <View className="px-6 pb-8 pt-16">
          <Text className="mb-8 font-product-bold text-4xl text-zinc-900">
            Profile
          </Text>

          {/* Profile Card */}
          <View className="mb-6 rounded-lg border border-zinc-200 bg-white p-6">
            <View className="mb-6 items-center">
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  className="mb-4 h-24 w-24 rounded-full"
                />
              ) : (
                <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-zinc-900">
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
              <Text className="text-zinc-600">
                {user?.emailAddresses[0]?.emailAddress}
              </Text>
            </View>

            <View className="gap-4 border-t border-zinc-200 pt-6">
              <View>
                <Text className="mb-1 text-sm text-zinc-500">Account ID</Text>
                <Text className="font-product text-zinc-900">{user?.id}</Text>
              </View>

              <View>
                <Text className="mb-1 text-sm text-zinc-500">
                  Account Created
                </Text>
                <Text className="font-product text-zinc-900">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : 'N/A'}
                </Text>
              </View>

              {user?.phoneNumbers && user.phoneNumbers.length > 0 && (
                <View>
                  <Text className="mb-1 text-sm text-zinc-500">
                    Phone Number
                  </Text>
                  <Text className="font-product text-zinc-900">
                    {user.phoneNumbers[0].phoneNumber}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Account Settings */}
          <View className="mb-6 rounded-lg border border-zinc-200 bg-white p-6">
            <Text className="mb-4 font-product-bold text-xl text-zinc-900">
              Account Settings
            </Text>
            <View className="gap-3">
              <View className="border-b border-zinc-100 py-3">
                <Text className="text-zinc-700">Notifications</Text>
              </View>
              <View className="border-b border-zinc-100 py-3">
                <Text className="text-zinc-700">Privacy & Security</Text>
              </View>
              <View className="py-3">
                <Text className="text-zinc-700">Help & Support</Text>
              </View>
            </View>
          </View>

          {/* Sign Out Button */}
          <SignOutButton />
        </View>
      </ScrollView>
    </View>
  );
}
