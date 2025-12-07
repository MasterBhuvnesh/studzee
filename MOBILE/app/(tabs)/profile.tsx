import { useUser } from "@clerk/clerk-expo";
import { Text, View, ScrollView, Image } from "react-native";
import { SignOutButton } from "@/components";

export default function ProfilePage() {
  const { user } = useUser();

  return (
    <View className="flex-1 bg-zinc-50">
      <ScrollView className="flex-1">
        <View className="px-6 pt-16 pb-8">
          <Text className="text-4xl font-product-bold text-zinc-900 mb-8">
            Profile
          </Text>

          {/* Profile Card */}
          <View className="bg-white border border-zinc-200 rounded-lg p-6 mb-6">
            <View className="items-center mb-6">
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  className="w-24 h-24 rounded-full mb-4"
                />
              ) : (
                <View className="w-24 h-24 rounded-full bg-zinc-900 items-center justify-center mb-4">
                  <Text className="text-white text-4xl font-product-bold">
                    {user?.firstName?.charAt(0) ||
                      user?.emailAddresses[0]?.emailAddress?.charAt(0) ||
                      "U"}
                  </Text>
                </View>
              )}

              <Text className="text-2xl font-product-bold text-zinc-900 mb-1">
                {user?.firstName || "User"} {user?.lastName || ""}
              </Text>
              <Text className="text-zinc-600">
                {user?.emailAddresses[0]?.emailAddress}
              </Text>
            </View>

            <View className="border-t border-zinc-200 pt-6 gap-4">
              <View>
                <Text className="text-zinc-500 text-sm mb-1">Account ID</Text>
                <Text className="text-zinc-900 font-product">{user?.id}</Text>
              </View>

              <View>
                <Text className="text-zinc-500 text-sm mb-1">
                  Account Created
                </Text>
                <Text className="text-zinc-900 font-product">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "N/A"}
                </Text>
              </View>

              {user?.phoneNumbers && user.phoneNumbers.length > 0 && (
                <View>
                  <Text className="text-zinc-500 text-sm mb-1">
                    Phone Number
                  </Text>
                  <Text className="text-zinc-900 font-product">
                    {user.phoneNumbers[0].phoneNumber}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Account Settings */}
          <View className="bg-white border border-zinc-200 rounded-lg p-6 mb-6">
            <Text className="text-xl font-product-bold text-zinc-900 mb-4">
              Account Settings
            </Text>
            <View className="gap-3">
              <View className="py-3 border-b border-zinc-100">
                <Text className="text-zinc-700">Notifications</Text>
              </View>
              <View className="py-3 border-b border-zinc-100">
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
