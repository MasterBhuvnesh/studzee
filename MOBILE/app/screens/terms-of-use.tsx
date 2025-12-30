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

export default function TermsOfUseScreen() {
  return (
    <LinearGradient
      colors={[colors.zinc[50], colors.zinc[100]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <Header title="Terms of Use" />
        <ScrollView
          className="flex-1 px-6 pt-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <Text className="font-sans text-sm text-zinc-500">
              Last updated: December 2025
            </Text>
          </View>

          <Section title="1. Acceptance of Terms">
            By accessing and using Studzee, you accept and agree to be bound by
            the terms and provisions of this agreement. If you do not agree to
            these terms, please do not use our service.
          </Section>

          <Section title="2. Description of Service">
            Studzee is an educational platform that provides study materials,
            quizzes, and learning resources designed to help students prepare
            for their academic goals. The service is provided "as is" and may be
            updated from time to time.
          </Section>

          <Section title="3. User Account">
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activities that occur under your
            account. You agree to notify us immediately of any unauthorized use
            of your account.
          </Section>

          <Section title="4. User Conduct">
            You agree not to use the service for any unlawful purpose or in any
            way that could damage, disable, or impair the service. You shall not
            attempt to gain unauthorized access to any part of the service or
            any systems connected to the service.
          </Section>

          <Section title="5. Intellectual Property">
            All content provided through Studzee, including but not limited to
            text, graphics, logos, and software, is the property of Studzee or
            its content providers and is protected by intellectual property
            laws.
          </Section>

          <Section title="6. Content Usage">
            The study materials and content provided are for personal,
            non-commercial educational use only. You may not reproduce,
            distribute, or create derivative works from any content without
            prior written permission.
          </Section>

          <Section title="7. Disclaimer of Warranties">
            The service is provided on an "as is" and "as available" basis. We
            make no warranties, expressed or implied, regarding the reliability,
            accuracy, or availability of the service.
          </Section>

          <Section title="8. Limitation of Liability">
            Studzee shall not be liable for any indirect, incidental, special,
            or consequential damages arising out of or in connection with your
            use of the service.
          </Section>

          <Section title="9. Changes to Terms">
            We reserve the right to modify these terms at any time. Continued
            use of the service after any such changes constitutes your
            acceptance of the new terms.
          </Section>

          <Section title="10. Contact Information">
            If you have any questions about these Terms of Use, please contact
            us at legal@studzee.in.
          </Section>

          <View className="mb-8" />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
