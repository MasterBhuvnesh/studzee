import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import React from 'react';
import { colors } from '@/constants/colors';
import OAuthButtons from '@/components/auth/OAuthButtons';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;
    setError('');

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/(tabs)');
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
        setError('Sign-in incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'Sign-in failed');
    }
  };

  return (
    <ScrollView className="flex-1 bg-zinc-50">
      <View className="px-6 pb-8 pt-16">
        <Text className="mb-2 font-product-bold text-4xl text-zinc-900">
          Welcome Back
        </Text>
        <Text className="mb-8 text-base text-zinc-600">
          Sign in to continue
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

        <View className="mb-4 gap-4">
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

        <View className="mb-6 items-end">
          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity>
              <Text className="text-sm text-zinc-600">Forgot password?</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <TouchableOpacity
          onPress={onSignInPress}
          className="mb-6 items-center rounded-lg bg-zinc-900 py-4"
        >
          <Text className="font-product-bold text-base text-white">
            Sign In
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center justify-center gap-2">
          <Text className="text-zinc-600">Don't have an account?</Text>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity>
              <Text className="font-product-bold text-zinc-900">Sign up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
