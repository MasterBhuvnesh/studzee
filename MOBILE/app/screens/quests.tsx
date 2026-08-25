import { AppIcon } from '@/components/global/AppIcon';
import { Header } from '@/components/global/Header';
import { colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { Target } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Placeholder home for quests. The backend does not serve quests yet; this
 * screen exists so the route is ready and a pushed quest has somewhere to
 * land. Quest types planned: MCQ, single choice, fill in the blank and read
 * a blog, each worth an admin set number of gems.
 */
export default function QuestsScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-zinc-50">
      <SafeAreaView className="flex-1">
        <Header title="Quests" />
        <View className="flex-1 items-center justify-center px-6 pb-24">
          <View className="w-full items-center rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg">
            <View className="mb-4 rounded-full bg-zinc-100 p-3">
              <AppIcon
                Icon={Target}
                color={colors.zinc[400]}
                size={22}
                strokeWidth={1.5}
              />
            </View>
            <Text className="font-product text-lg text-zinc-800">
              No Quests Yet
            </Text>
            <Text className="mt-2 text-center font-sans text-sm leading-5 text-zinc-500">
              Weekly challenges, topic tests and reading quests will appear
              here. Complete them to earn gems.
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-3 active:bg-zinc-100"
              activeOpacity={0.8}
            >
              <Text className="font-product text-sm text-zinc-700">
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
