import { AppIcon } from '@/components/global/AppIcon';
import { colors } from '@/constants/colors';
import logger from '@/utils/logger';
import { useSignIn } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BanIcon, CheckCircle } from 'lucide-react-native';
import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export default function ForgotPasswordScreen() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [error, setError] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  const onRequestReset = async () => {
    if (!isLoaded) return;
    setError('');
    setSuccessMessage('');

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: emailAddress,
      });

      setSuccessMessage('Reset code sent! Check your email.');

      // Navigate to reset password screen after a short delay
      setTimeout(() => {
        router.push({
          pathname: '/(auth)/reset-password',
          params: { email: emailAddress },
        });
      }, 2000);
    } catch (err: any) {
      logger.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'Failed to send reset code');
    }
  };

  return (
    <LinearGradient
      colors={[
        '#ffffff',
        '#ffffff',
        '#ffffff',
        '#ffffff',
        colors.zinc[50],
        colors.zinc[100],
        colors.zinc[200],
      ]}
      start={{ x: 0, y: 1 }}
      end={{ x: 0, y: 0 }}
      className="flex-1"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 justify-center px-6">
              <Text className="mb-2 pb-4 font-product text-4xl text-zinc-800">
                Forgot Password?
              </Text>
              <Text className="mb-8 font-product text-base text-zinc-500">
                Enter your email address and we'll send you a code to reset your
                password.
              </Text>

              {error ? (
                <View className="mb-4 flex-row items-center rounded-lg border border-red-200 bg-red-50 p-3">
                  <AppIcon
                    Icon={BanIcon}
                    size={16}
                    color={colors.red[500]}
                    strokeWidth={1.5}
                  />
                  <Text className="ml-2 font-sans text-sm text-red-500">
                    {error}
                  </Text>
                </View>
              ) : null}

              {successMessage ? (
                <View className="mb-4 flex-row items-center rounded-lg border border-green-200 bg-green-50 p-3">
                  <AppIcon
                    Icon={CheckCircle}
                    size={16}
                    color={colors.green[600]}
                    strokeWidth={1.5}
                  />
                  <Text className="ml-2 mr-2 font-sans text-sm text-green-700">
                    {successMessage}
                  </Text>
                </View>
              ) : null}

              <TextInput
                autoCapitalize="none"
                value={emailAddress}
                placeholder="Email address"
                onChangeText={setEmailAddress}
                keyboardType="email-address"
                className="mb-6 rounded-lg border border-zinc-200 bg-white px-4 py-3 font-product text-zinc-700"
                placeholderTextColor={colors.zinc[400]}
              />

              <TouchableOpacity
                onPress={onRequestReset}
                className="mb-4 items-center rounded-lg bg-zinc-800 py-4"
              >
                <Text className="font-product text-base text-white">
                  Send Reset Code
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.back()}
                className="items-center py-2"
              >
                <Text className="font-product text-sm text-zinc-500">
                  Back to Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
