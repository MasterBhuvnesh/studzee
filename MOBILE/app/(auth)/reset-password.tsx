import { useSignIn } from '@clerk/clerk-expo';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { colors } from '@/constants/colors';

export default function ResetPasswordScreen() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [code, setCode] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const onResetPassword = async () => {
    if (!isLoaded) return;
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });

      if (result.status === 'complete') {
        // Password reset successful
        router.replace('/(auth)/sign-in');
      } else {
        setError('Password reset incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'Failed to reset password');
    }
  };

  return (
    <View className="flex-1 justify-center bg-zinc-50 px-6">
      <Text className="mb-2 font-product-bold text-4xl text-zinc-900">
        Reset Password
      </Text>
      <Text className="mb-8 text-base text-zinc-600">
        Enter the code sent to {email} and your new password.
      </Text>

      {error ? (
        <View className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <Text className="text-sm text-red-800">{error}</Text>
        </View>
      ) : null}

      <View className="mb-6 gap-4">
        <TextInput
          value={code}
          placeholder="Verification code"
          onChangeText={setCode}
          keyboardType="number-pad"
          className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-900"
          placeholderTextColor={colors.zinc[400]}
        />
        <TextInput
          value={password}
          placeholder="New password"
          secureTextEntry={true}
          onChangeText={setPassword}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-900"
          placeholderTextColor={colors.zinc[400]}
        />
        <TextInput
          value={confirmPassword}
          placeholder="Confirm new password"
          secureTextEntry={true}
          onChangeText={setConfirmPassword}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-900"
          placeholderTextColor={colors.zinc[400]}
        />
      </View>

      <TouchableOpacity
        onPress={onResetPassword}
        className="mb-4 items-center rounded-lg bg-zinc-900 py-4"
      >
        <Text className="font-product-bold text-base text-white">
          Reset Password
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
        className="items-center py-2"
      >
        <Text className="text-sm text-zinc-600">Back</Text>
      </TouchableOpacity>
    </View>
  );
}
