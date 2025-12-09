import OAuthButtons from '@/components/auth/OAuthButtons';
import { AppIcon } from '@/components/global/AppIcon';
import { colors } from '@/constants/colors';
import logger from '@/utils/logger';
import { useSignUp } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { BanIcon, Eye, EyeOff } from 'lucide-react-native';
import * as React from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

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
            <View className="flex-1 justify-center px-6">
              <Text className="mb-2 font-product text-4xl text-zinc-800">
                Verify your email
              </Text>
              <Text className="mb-8 font-product text-base text-zinc-500">
                We sent a verification code to {emailAddress}
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

              <TextInput
                value={code}
                placeholder="Enter verification code"
                onChangeText={setCode}
                keyboardType="number-pad"
                className="mb-4 rounded-lg border border-zinc-200 bg-white px-4 py-3 font-product text-zinc-700"
                placeholderTextColor={colors.zinc[400]}
              />

              <TouchableOpacity
                onPress={onVerifyPress}
                className="mb-4 items-center rounded-lg bg-zinc-800 py-4"
              >
                <Text className="font-product text-base text-white">
                  Verify
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

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
            <SafeAreaView style={{ flex: 1 }}>
              {/* Header */}
              <View className="items-center justify-center px-4">
                <Image
                  source={require('@/assets/images/studzee.png')}
                  contentFit="cover"
                  style={{ width: 150, height: 150 }}
                  className="items-center justify-center"
                />
                <Text className="mb-2 font-product text-4xl text-zinc-800">
                  Create Account
                </Text>
                <Text className="m-2 mb-4 text-center font-product text-base text-zinc-500">
                  Join us and learn complex concepts the easy way - one simple
                  explanation at a time.
                </Text>
              </View>

              {/* Error */}
              {error ? (
                <View className="m-4 flex-row items-center rounded-lg border border-red-200 bg-red-50 p-3">
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

              <View className="mb-6">
                <OAuthButtons onError={setError} />
              </View>

              <View className="ml-6 mr-6 flex-row items-center gap-4">
                <View className="h-px flex-1 bg-zinc-200" />
                <Text className="font-product text-base text-zinc-400">or</Text>
                <View className="h-px flex-1 bg-zinc-200" />
              </View>

              <View className="m-4 mt-6 gap-4">
                <TextInput
                  autoCapitalize="none"
                  value={emailAddress}
                  placeholder="Email address"
                  onChangeText={setEmailAddress}
                  keyboardType="email-address"
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-3 font-product text-zinc-700"
                  placeholderTextColor={colors.zinc[400]}
                />
                <View className="relative">
                  <TextInput
                    value={password}
                    placeholder="Password"
                    secureTextEntry={!showPassword}
                    onChangeText={setPassword}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-3 pr-12 font-product text-zinc-700"
                    placeholderTextColor={colors.zinc[400]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3"
                  >
                    {showPassword ? (
                      <AppIcon
                        Icon={EyeOff}
                        size={20}
                        strokeWidth={1.5}
                        color={colors.zinc[400]}
                      />
                    ) : (
                      <AppIcon
                        Icon={Eye}
                        size={20}
                        strokeWidth={1.5}
                        color={colors.zinc[400]}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={onSignUpPress}
                className="m-4 items-center rounded-lg bg-zinc-800 py-4"
              >
                <Text className="font-product text-base text-white">
                  Create Account
                </Text>
              </TouchableOpacity>

              <View className="mb-6 flex-row items-center justify-center gap-2">
                <Text className="font-product text-base text-zinc-500">
                  Already have an account?
                </Text>
                <Link href="/(auth)/sign-in" asChild>
                  <TouchableOpacity>
                    <Text className="font-product text-base text-zinc-700">
                      Sign in
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </SafeAreaView>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
