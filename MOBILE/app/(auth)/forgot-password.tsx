import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { colors } from '@/constants/colors';

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

      setSuccessMessage(
        'A password reset code has been sent to your email address.'
      );

      // Navigate to reset password screen after a short delay
      setTimeout(() => {
        router.push({
          pathname: '/(auth)/reset-password',
          params: { email: emailAddress },
        });
      }, 2000);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'Failed to send reset code');
    }
  };

  return (
    <View className="flex-1 justify-center bg-zinc-50 px-6">
      <Text className="mb-2 font-product-bold text-4xl text-zinc-900">
        Forgot Password?
      </Text>
      <Text className="mb-8 text-base text-zinc-600">
        Enter your email address and we'll send you a code to reset your
        password.
      </Text>

      {error ? (
        <View className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <Text className="text-sm text-red-800">{error}</Text>
        </View>
      ) : null}

      {successMessage ? (
        <View className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
          <Text className="text-sm text-green-800">{successMessage}</Text>
        </View>
      ) : null}

      <TextInput
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Email address"
        onChangeText={setEmailAddress}
        keyboardType="email-address"
        className="mb-6 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-900"
        placeholderTextColor={colors.zinc[400]}
      />

      <TouchableOpacity
        onPress={onRequestReset}
        className="mb-4 items-center rounded-lg bg-zinc-900 py-4"
      >
        <Text className="font-product-bold text-base text-white">
          Send Reset Code
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
        className="items-center py-2"
      >
        <Text className="text-sm text-zinc-600">Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}
