import { SignOutButton } from '@/components/auth/SignOutButton';
import { AppIcon } from '@/components/global/AppIcon';
import { BottomFade } from '@/components/global/BottomFade';
import { Header } from '@/components/global/Header';
import { colors } from '@/constants/colors';
import { useNotification } from '@/contexts/NotificationContext';
import { useNotificationPermissions } from '@/hooks/useNotificationPermissions';
import { SettingCardProps } from '@/types';
import logger from '@/utils/logger';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import {
  Bell,
  BellOff,
  ChevronRight,
  FileText,
  HelpCircle,
  Mail,
  Menu,
  MessageCircle,
  PartyPopper,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CELEBRATE = require('@/assets/lottie/celebrate.json');

const SettingCard = ({ title, items }: SettingCardProps) => (
  <View className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
    <View className="border-b border-zinc-100 bg-zinc-50 px-6 py-4">
      <Text className="font-product text-base text-zinc-800">{title}</Text>
    </View>
    <View className="p-2">
      {items.map((item, index) => (
        <View key={index}>
          <TouchableOpacity
            onPress={item.onPress}
            className="flex-row items-center justify-between rounded-xl px-4 py-2 active:bg-zinc-50"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-2">
              <AppIcon Icon={item.icon} size={16} strokeWidth={1.5} />
              <Text className="font-sans text-base text-zinc-500">
                {item.label}
              </Text>
            </View>
            {item.hasToggle ? (
              item.toggleLoading ? (
                <ActivityIndicator color={colors.blue[500]} size="small" />
              ) : (
                <Switch
                  value={item.toggleValue}
                  onValueChange={item.onToggleChange}
                  trackColor={{
                    false: colors.zinc[300],
                    true: colors.blue[200],
                  }}
                  thumbColor={
                    item.toggleValue ? colors.blue[500] : colors.zinc[50]
                  }
                  ios_backgroundColor={colors.zinc[300]}
                />
              )
            ) : (
              <AppIcon
                Icon={ChevronRight}
                color={colors.zinc[500]}
                size={16}
                strokeWidth={1.5}
              />
            )}
          </TouchableOpacity>
          {index < items.length - 1 && (
            <View className="mx-4 h-px bg-zinc-100" />
          )}
        </View>
      ))}
    </View>
  </View>
);

export default function SettingsPage() {
  const router = useRouter();
  const { expoPushToken, isLoading } = useNotification();
  const [lottieVisible, setLottieVisible] = useState(false);
  const {
    granted,
    status,
    loading: checkingPermissions,
    requestNotificationPermission,
  } = useNotificationPermissions();

  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const handleNotificationToggle = () => {
    // Undetermined means the native prompt was never answered, so it can be
    // asked directly. Once decided, only the OS owns the change.
    if (status === 'undetermined') {
      void requestNotificationPermission();
    } else {
      handleOpenSettings();
    }
  };

  return (
    <LinearGradient
      colors={[colors.zinc[50], colors.zinc[100]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1 bg-transparent">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <Header title="Settings" />
          <View className="px-6 pb-8 pt-6">
            {/* Experience Settings */}
            <SettingCard
              title="Experience"
              items={[
                {
                  label: 'App Notifications',
                  onPress: handleNotificationToggle,
                  icon: expoPushToken ? Bell : BellOff,
                  // The switch mirrors the OS permission, the thing the
                  // toggle actually controls. The Bell icon carries whether
                  // a push token is registered with the backend.
                  hasToggle: true,
                  toggleValue: granted,
                  onToggleChange: handleNotificationToggle,
                  toggleLoading: isLoading || checkingPermissions,
                },

                {
                  label: 'Newsletters',
                  onPress: () => logger.debug('Newsletters pressed'),
                  icon: Mail,
                },
              ]}
            />

            {/* Support Settings */}
            <SettingCard
              title="Support"
              items={[
                {
                  label: 'Get Support',
                  onPress: () => router.push('/screens/get-support'),
                  icon: HelpCircle,
                },
                {
                  label: 'Send Feedback',
                  onPress: () => router.push('/screens/send-feedback'),
                  icon: MessageCircle,
                },
                {
                  label: 'Terms of Use',
                  onPress: () => router.push('/screens/terms-of-use'),
                  icon: Menu,
                },
                {
                  label: 'Privacy Policy',
                  onPress: () => router.push('/screens/privacy-policy'),
                  icon: FileText,
                },
              ]}
            />

            {/* Account Settings */}
            {/* <SettingCard
              title="Account"
              items={[
                {
                  label: 'Change Password',
                  onPress: () => logger.debug('Change Password pressed'),
                  icon: Lock,
                },
              ]}
            /> */}

            {/* Diagnostics: proves whether the celebration animation renders
                on this build, isolated from any quiz or badge logic. */}
            <SettingCard
              title="Diagnostics"
              items={[
                {
                  label: 'Test Celebration Animation',
                  onPress: () => {
                    logger.info('Diagnostics: overlay mounting');
                    setLottieVisible(true);
                    // Fixed window so a broken animation cannot hide itself
                    setTimeout(() => {
                      logger.info('Diagnostics: overlay closing');
                      setLottieVisible(false);
                    }, 5000);
                  },
                  icon: PartyPopper,
                },
              ]}
            />

            {/* Sign Out Button */}
            <SignOutButton />
          </View>
        </ScrollView>
        <BottomFade />

        {/* Diagnostics overlay: the dimming plus caption prove the overlay
            mounts, the confetti proves the Lottie draws. Hidden on a timer
            because an instant onFinish would otherwise hide it silently. */}
        {lottieVisible && (
          <View className="absolute inset-0 bg-black/60">
            <Text className="pt-24 text-center font-sans text-sm text-white">
              Celebration test: overlay is mounted
            </Text>
            <LottieView
              source={CELEBRATE}
              autoPlay
              loop={false}
              style={{ width: '100%', height: '100%' }}
              onAnimationFinish={() =>
                logger.info('Diagnostics: onAnimationFinish fired')
              }
            />
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}
