// TODO : icons and user profile
import { SignOutButton } from '@/components/auth/SignOutButton';
import { AppIcon } from '@/components/global/AppIcon';
import { colors } from '@/constants/colors';
import { SettingCardProps } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  ChevronRight,
  FileText,
  HelpCircle,
  Languages,
  Lock,
  Mail,
  Menu,
  MessageCircle,
} from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
            <AppIcon
              Icon={ChevronRight}
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

export default function SettingsPage() {
  return (
    <LinearGradient
      colors={[colors.zinc[50], colors.zinc[100]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1 bg-transparent">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 pt-6">
            <Text className="py-2 font-product text-4xl text-zinc-900">
              Settings
            </Text>
          </View>
          <View className="px-6 pb-8 pt-6">
            {/* Experience Settings */}
            <SettingCard
              title="Experience"
              items={[
                {
                  label: 'App Notifications',
                  onPress: () => console.log('App Notifications'),
                  icon: Bell,
                },
                {
                  label: 'Language',
                  onPress: () => console.log('Language'),
                  icon: Languages,
                },
                {
                  label: 'Newsletters',
                  onPress: () => console.log('Newsletters'),
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
                  onPress: () => console.log('Get Support'),
                  icon: HelpCircle,
                },
                {
                  label: 'Send Feedback',
                  onPress: () => console.log('Send Feedback'),
                  icon: MessageCircle,
                },
                {
                  label: 'Terms of Use',
                  onPress: () => console.log('Terms of Use'),
                  icon: Menu,
                },
                {
                  label: 'Privacy Policy',
                  onPress: () => console.log('Privacy Policy'),
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
                  onPress: () => console.log('Change Password'),
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
