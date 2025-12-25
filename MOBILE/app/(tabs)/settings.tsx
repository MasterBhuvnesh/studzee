import { SignOutButton } from '@/components/auth/SignOutButton';
import { AppIcon } from '@/components/global/AppIcon';
import { Header } from '@/components/global/Header';
import { colors } from '@/constants/colors';
import { useNotification } from '@/contexts/NotificationContext';
import { SettingCardProps } from '@/types';
import logger from '@/utils/logger';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  BellOff,
  ChevronRight,
  FileText,
  HelpCircle,
  Lock,
  Mail,
  Menu,
  MessageCircle,
} from 'lucide-react-native';
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
  const { expoPushToken, isLoading } = useNotification();

  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const handleNotificationToggle = async () => {
    // Since permissions are handled automatically on app start,
    // we can only direct users to system settings to change them
    handleOpenSettings();
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
                  onPress: handleOpenSettings,
                  icon: expoPushToken ? Bell : BellOff,
                  hasToggle: true,
                  toggleValue: !!expoPushToken,
                  onToggleChange: handleNotificationToggle,
                  toggleLoading: isLoading,
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
                  onPress: () => logger.debug('Get Support pressed'),
                  icon: HelpCircle,
                },
                {
                  label: 'Send Feedback',
                  onPress: () => logger.debug('Send Feedback pressed'),
                  icon: MessageCircle,
                },
                {
                  label: 'Terms of Use',
                  onPress: () => logger.debug('Terms of Use pressed'),
                  icon: Menu,
                },
                {
                  label: 'Privacy Policy',
                  onPress: () => logger.debug('Privacy Policy pressed'),
                  icon: FileText,
                },
              ]}
            />

            {/* Account Settings */}
            <SettingCard
              title="Account"
              items={[
                {
                  label: 'Change Password',
                  onPress: () => logger.debug('Change Password pressed'),
                  icon: Lock,
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
