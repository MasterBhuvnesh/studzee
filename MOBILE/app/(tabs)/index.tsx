import { SignedIn, useUser } from "@clerk/clerk-expo";
import { Text, View, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function HomePage() {
  const { user } = useUser();

  return (
    <View className="flex-1 bg-zinc-50">
      <StatusBar style="dark" />
      <ScrollView className="flex-1">
        <View className="px-6 pt-16 pb-8">
          <Text className="text-4xl font-product-bold text-zinc-900 mb-2">
            Welcome Back!
          </Text>
          <SignedIn>
            <Text className="text-zinc-600 text-base mb-8">
              Hello, {user?.emailAddresses[0]?.emailAddress || user?.firstName || "User"}
            </Text>
          </SignedIn>

          {/* App Features */}
          <View className="gap-4">
            <View className="bg-white border border-zinc-200 rounded-lg p-6">
              <Text className="text-2xl font-product-bold text-zinc-900 mb-2">
                📚 Studzee
              </Text>
              <Text className="text-zinc-600 text-base">
                Your personal learning companion. Access courses, track progress,
                and achieve your goals.
              </Text>
            </View>

            <View className="bg-white border border-zinc-200 rounded-lg p-6">
              <Text className="text-xl font-product-bold text-zinc-900 mb-2">
                Quick Actions
              </Text>
              <View className="gap-3 mt-3">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-zinc-900 rounded-full items-center justify-center">
                    <Text className="text-white text-lg">📦</Text>
                  </View>
                  <Text className="text-zinc-700 flex-1">
                    Browse available packages
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-zinc-900 rounded-full items-center justify-center">
                    <Text className="text-white text-lg">👤</Text>
                  </View>
                  <Text className="text-zinc-700 flex-1">
                    Update your profile
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-lg p-6">
              <Text className="text-2xl font-product-bold text-white mb-2">
                Get Started
              </Text>
              <Text className="text-zinc-300 text-base">
                Explore our packages tab to discover courses tailored for you.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
