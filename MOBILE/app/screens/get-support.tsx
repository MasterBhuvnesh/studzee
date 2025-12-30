import { AppIcon } from '@/components/global/AppIcon';
import { colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight,
  HelpCircle,
  Mail,
  MessageCircle,
} from 'lucide-react-native';
import {
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FAQItem = ({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) => (
  <View className="mb-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
    <Text className="mb-2 font-product text-base text-zinc-800">
      {question}
    </Text>
    <Text className="font-sans text-sm leading-relaxed text-zinc-500">
      {answer}
    </Text>
  </View>
);

const ContactOption = ({
  icon: Icon,
  title,
  subtitle,
  onPress,
}: {
  icon: typeof Mail;
  title: string;
  subtitle: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="mb-3 flex-row items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm active:bg-zinc-50"
    activeOpacity={0.7}
  >
    <View className="mr-4 rounded-full bg-zinc-100 p-3">
      <AppIcon
        Icon={Icon}
        size={20}
        color={colors.zinc[700]}
        strokeWidth={1.5}
      />
    </View>
    <View className="flex-1">
      <Text className="font-product text-base text-zinc-800">{title}</Text>
      <Text className="font-sans text-sm text-zinc-500">{subtitle}</Text>
    </View>
    <AppIcon
      Icon={ChevronRight}
      size={18}
      color={colors.zinc[400]}
      strokeWidth={1.5}
    />
  </TouchableOpacity>
);

export default function GetSupportScreen() {
  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@studzee.in?subject=Support Request');
  };

  const faqs = [
    {
      question: 'How do I access my study materials?',
      answer:
        'Navigate to the Home tab and browse through the available content. Tap on any topic to view detailed study materials, key notes, and quizzes.',
    },
    {
      question: 'How do I enable notifications?',
      answer:
        'Go to Settings > App Notifications and toggle the switch on. You can also manage notification preferences in your device settings.',
    },
    {
      question: 'Can I download content for offline use?',
      answer:
        'Currently, content is available online. We are working on offline support for future updates.',
    },
    {
      question: 'How do I update my profile?',
      answer:
        'Go to the Profile tab and tap the edit button to update your name and profile picture.',
    },
  ];

  return (
    <LinearGradient
      colors={[colors.zinc[50], colors.zinc[100]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1 px-6 pt-6"
          showsVerticalScrollIndicator={false}
        >
          <Text className="mb-5 font-product text-4xl text-zinc-800">
            Get Support
          </Text>
          {/* Contact Options */}
          <Text className="mb-4 font-product text-lg text-zinc-800">
            Contact Us
          </Text>
          <ContactOption
            icon={Mail}
            title="Email Support"
            subtitle="Get help via email"
            onPress={handleEmailSupport}
          />
          <ContactOption
            icon={MessageCircle}
            title="Live Chat"
            subtitle="Coming soon"
            onPress={() => {}}
          />

          {/* FAQs */}
          <Text className="mb-4 mt-6 font-product text-lg text-zinc-800">
            Frequently Asked Questions
          </Text>
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}

          {/* Help Center */}
          <View className="mb-12 mt-6 items-center rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <View className="mb-3 rounded-full bg-zinc-100 p-4">
              <AppIcon
                Icon={HelpCircle}
                size={32}
                color={colors.zinc[700]}
                strokeWidth={1.5}
              />
            </View>
            <Text className="mb-2 font-product text-base text-zinc-800">
              Need more help?
            </Text>
            <Text className="text-center font-sans text-sm text-zinc-500">
              Our support team is available Monday to Friday, 9 AM to 6 PM IST.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
