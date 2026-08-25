import { AppIcon } from '@/components/global/AppIcon';
import { colors } from '@/constants/colors';
import { getUnreadCount } from '@/lib/inapp';
import { useFocusEffect } from 'expo-router';
import { Bell } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Bell entry point to the in-app notification centre. The unread dot
 * refreshes every time the screen the bell lives on comes back into focus.
 */
export const NotificationBell = () => {
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    setUnread(await getUnreadCount());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return undefined;
    }, [refresh])
  );

  return (
    <TouchableOpacity
      onPress={() => router.push('/screens/notifications')}
      className="rounded-full p-2 active:bg-zinc-200"
      activeOpacity={0.7}
    >
      <AppIcon Icon={Bell} color={colors.zinc[700]} size={22} strokeWidth={2} />
      {unread > 0 && (
        <View className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
      )}
    </TouchableOpacity>
  );
};
