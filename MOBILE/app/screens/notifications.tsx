import { AppIcon } from '@/components/global/AppIcon';
import { colors } from '@/constants/colors';
import {
  clearNotifications,
  getNotifications,
  markAllRead,
  InAppNotification,
} from '@/lib/inapp';
import logger from '@/utils/logger';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * The in-app notification centre. Events are recorded on device (badge
 * unlocks, perfect scores) and live in SecureStore, so opening this screen
 * is also what marks them read.
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await getNotifications();
        setEvents(stored);
        await markAllRead();
      } catch (error) {
        logger.error(`Failed to load notifications: ${error}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleClear = async () => {
    await clearNotifications();
    setEvents([]);
    logger.info('In-app notifications cleared');
  };

  return (
    <LinearGradient
      colors={[colors.zinc[50], colors.zinc[100]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center gap-3 px-6 pb-4 pt-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="rounded-full p-2 active:bg-zinc-200"
            activeOpacity={0.7}
          >
            <AppIcon
              Icon={ArrowLeft}
              color={colors.zinc[700]}
              size={24}
              strokeWidth={2}
            />
          </TouchableOpacity>
          <Text className="flex-1 font-product text-xl text-zinc-800">
            Notifications
          </Text>
          {events.length > 0 && (
            <TouchableOpacity
              onPress={handleClear}
              className="rounded-full p-2 active:bg-zinc-200"
              activeOpacity={0.7}
            >
              <AppIcon
                Icon={Trash2}
                color={colors.zinc[500]}
                size={20}
                strokeWidth={1.5}
              />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View className="px-6 pt-2">
            {[1, 2, 3].map(index => (
              <View
                key={index}
                className="mb-3 h-20 rounded-2xl border border-zinc-200 bg-white p-4"
              >
                <View className="mb-2 h-4 w-1/2 rounded bg-zinc-100" />
                <View className="h-3 w-3/4 rounded bg-zinc-100" />
              </View>
            ))}
          </View>
        ) : events.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-center font-sans text-base text-zinc-400">
              Nothing yet. Badge unlocks and perfect scores will land here as
              they happen.
            </Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
          >
            {events.map(event => (
              <View
                key={event.id}
                className="mb-3 rounded-2xl border border-zinc-200 bg-white p-4"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="font-product text-sm text-zinc-800">
                    {event.title}
                  </Text>
                  <Text className="font-sans text-xs text-zinc-400">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text className="mt-1 font-sans text-sm leading-5 text-zinc-500">
                  {event.body}
                </Text>
              </View>
            ))}
            <View className="h-8" />
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}
