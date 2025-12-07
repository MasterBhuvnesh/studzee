import { SignedIn, useUser } from '@clerk/clerk-expo';
import { Text, View, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function HomePage() {
  const { user } = useUser();

  return (
    <View className="flex-1 bg-zinc-50">
      <StatusBar style="dark" />
      <ScrollView className="flex-1">
        <View className="px-6 pb-8 pt-16">
          <Text className="mb-2 font-product-bold text-4xl text-zinc-900">
            Welcome Back!
          </Text>
          <SignedIn>
            <Text className="mb-8 text-base text-zinc-600">
              Hello,{' '}
              {user?.emailAddresses[0]?.emailAddress ||
                user?.firstName ||
                'User'}
            </Text>
          </SignedIn>

          {/* App Features */}
          <View className="gap-4">
            <View className="rounded-lg border border-zinc-200 bg-white p-6">
              <Text className="mb-2 font-product-bold text-2xl text-zinc-900">
                📚 Studzee
              </Text>
              <Text className="text-base text-zinc-600">
                Your personal learning companion. Access courses, track
                progress, and achieve your goals.
              </Text>
            </View>

            <View className="rounded-lg border border-zinc-200 bg-white p-6">
              <Text className="mb-2 font-product-bold text-xl text-zinc-900">
                Quick Actions
              </Text>
              <View className="mt-3 gap-3">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-zinc-900">
                    <Text className="text-lg text-white">📦</Text>
                  </View>
                  <Text className="flex-1 text-zinc-700">
                    Browse available packages
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-zinc-900">
                    <Text className="text-lg text-white">👤</Text>
                  </View>
                  <Text className="flex-1 text-zinc-700">
                    Update your profile
                  </Text>
                </View>
              </View>
            </View>

            <View className="rounded-lg bg-gradient-to-br from-zinc-900 to-zinc-800 p-6">
              <Text className="mb-2 font-product-bold text-2xl text-white">
                Get Started
              </Text>
              <Text className="text-base text-zinc-300">
                Explore our packages tab to discover courses tailored for you.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
