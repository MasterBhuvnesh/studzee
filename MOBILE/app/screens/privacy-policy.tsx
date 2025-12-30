import { Header } from '@/components/global/Header';
import { colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View className="mb-6">
    <Text className="mb-2 font-product text-base text-zinc-800">{title}</Text>
    <Text className="font-sans text-sm leading-relaxed text-zinc-600">
      {children}
    </Text>
  </View>
);

const BulletPoint = ({ children }: { children: React.ReactNode }) => (
  <View className="mb-2 flex-row">
    <Text className="mr-2 text-zinc-600">•</Text>
    <Text className="flex-1 font-sans text-sm leading-relaxed text-zinc-600">
      {children}
    </Text>
  </View>
);

export default function PrivacyPolicyScreen() {
  return (
    <LinearGradient
      colors={[colors.zinc[50], colors.zinc[100]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <Header title="Privacy Policy" />
        <ScrollView
          className="flex-1 px-6 pt-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <Text className="font-sans text-sm text-zinc-500">
              Last updated: December 2025
            </Text>
          </View>

          <Section title="1. Introduction">
            At Studzee, we take your privacy seriously. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your
            information when you use our mobile application.
          </Section>

          <Section title="2. Information We Collect">
            We may collect the following types of information:
          </Section>
          <View className="mb-4 ml-2">
            <BulletPoint>
              Account information (name, email address, profile picture)
            </BulletPoint>
            <BulletPoint>
              Usage data (features used, content accessed, time spent)
            </BulletPoint>
            <BulletPoint>
              Device information (device type, operating system, app version)
            </BulletPoint>
            <BulletPoint>
              Push notification tokens for sending notifications
            </BulletPoint>
          </View>

          <Section title="3. How We Use Your Information">
            We use the information we collect to:
          </Section>
          <View className="mb-4 ml-2">
            <BulletPoint>Provide and maintain our service</BulletPoint>
            <BulletPoint>Personalize your learning experience</BulletPoint>
            <BulletPoint>
              Send you important updates and notifications
            </BulletPoint>
            <BulletPoint>Improve our app and develop new features</BulletPoint>
            <BulletPoint>
              Respond to your inquiries and support requests
            </BulletPoint>
          </View>

          <Section title="4. Data Security">
            We implement appropriate technical and organizational security
            measures to protect your personal information. However, no method of
            transmission over the Internet is 100% secure, and we cannot
            guarantee absolute security.
          </Section>

          <Section title="5. Third-Party Services">
            We may use third-party services that collect information used to
            identify you. These services have their own privacy policies
            addressing how they use such information.
          </Section>

          <Section title="6. Data Retention">
            We retain your personal information only for as long as necessary to
            provide you with our services and as described in this Privacy
            Policy. We will also retain and use your information to comply with
            our legal obligations.
          </Section>

          <Section title="7. Your Rights">You have the right to:</Section>
          <View className="mb-4 ml-2">
            <BulletPoint>Access your personal data</BulletPoint>
            <BulletPoint>Request correction of your personal data</BulletPoint>
            <BulletPoint>Request deletion of your personal data</BulletPoint>
            <BulletPoint>Opt-out of marketing communications</BulletPoint>
          </View>

          <Section title="8. Children's Privacy">
            Our service is not intended for children under 13 years of age. We
            do not knowingly collect personal information from children under
            13.
          </Section>

          <Section title="9. Changes to This Policy">
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the "Last updated" date.
          </Section>

          <Section title="10. Contact Us">
            If you have any questions about this Privacy Policy, please contact
            us at privacy@studzee.in.
          </Section>

          <View className="mb-8" />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
