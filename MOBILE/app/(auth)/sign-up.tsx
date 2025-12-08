import OAuthButtons from '@/components/auth/OAuthButtons';
import { colors } from '@/constants/colors';
import logger from '@/utils/logger';
import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import * as React from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setError('');

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      logger.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'Sign-up failed');
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setError('');

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/(tabs)');
      } else {
        logger.error(JSON.stringify(signUpAttempt, null, 2));
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      logger.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'Verification failed');
    }
  };

  if (pendingVerification) {
    return (
      <View className="flex-1 justify-center bg-zinc-50 px-6">
        <Text className="mb-2 font-product-bold text-3xl text-zinc-900">
          Verify your email
        </Text>
        <Text className="mb-8 text-zinc-600">
          We sent a verification code to {emailAddress}
        </Text>

        {error ? (
          <View className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <Text className="text-sm text-red-800">{error}</Text>
          </View>
        ) : null}

        <TextInput
          value={code}
          placeholder="Enter verification code"
          onChangeText={setCode}
          keyboardType="number-pad"
          className="mb-4 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-900"
          placeholderTextColor={colors.zinc[400]}
        />

        <TouchableOpacity
          onPress={onVerifyPress}
          className="mb-4 items-center rounded-lg bg-zinc-900 py-4"
        >
          <Text className="font-product-bold text-base text-white">Verify</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-zinc-50">
      <View className="px-6 pb-8 pt-16">
        <Text className="mb-2 font-product-bold text-4xl text-zinc-900">
          Create Account
        </Text>
        <Text className="mb-8 text-base text-zinc-600">
          Sign up to get started
        </Text>

        {error ? (
          <View className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <Text className="text-sm text-red-800">{error}</Text>
          </View>
        ) : null}

        <View className="mb-6">
          <OAuthButtons onError={setError} />
        </View>

        <View className="mb-6 flex-row items-center gap-4">
          <View className="h-px flex-1 bg-zinc-200" />
          <Text className="text-sm text-zinc-500">or</Text>
          <View className="h-px flex-1 bg-zinc-200" />
        </View>

        <View className="mb-6 gap-4">
          <TextInput
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Email address"
            onChangeText={setEmailAddress}
            keyboardType="email-address"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-900"
            placeholderTextColor={colors.zinc[400]}
          />
          <TextInput
            value={password}
            placeholder="Password"
            secureTextEntry={true}
            onChangeText={setPassword}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-900"
            placeholderTextColor={colors.zinc[400]}
          />
        </View>

        <TouchableOpacity
          onPress={onSignUpPress}
          className="mb-6 items-center rounded-lg bg-zinc-900 py-4"
        >
          <Text className="font-product-bold text-base text-white">
            Create Account
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center justify-center gap-2">
          <Text className="text-zinc-600">Already have an account?</Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity>
              <Text className="font-product-bold text-zinc-900">Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
