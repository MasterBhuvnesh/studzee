import OAuthButtons from '@/components/auth/OAuthButtons';
import { colors } from '@/constants/colors';
import logger from '@/utils/logger';
import { useSignIn } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { BanIcon, Eye, EyeOff } from 'lucide-react-native';
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
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

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
        logger.debug(JSON.stringify(signInAttempt, null, 2));
        setError('Sign-in incomplete. Please try again.');
      }
    } catch (err: any) {
      logger.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'Sign-in failed');
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
                  Yooo, welcome back !
                </Text>
                <Text className="m-2 mb-4 text-center font-product text-base text-zinc-500">
                  Continue learning smarter with clear, simplified concepts.
                </Text>
              </View>

              {/* Error */}
              {error ? (
                <View className="m-4 flex-row items-center rounded-lg border border-red-200 bg-red-50 p-3">
                  <BanIcon
                    size={16}
                    color={colors.red[500]}
                    strokeWidth={1.5}
                    stroke={colors.red[500]}
                    fill="none"
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
                      <EyeOff
                        size={20}
                        strokeWidth={1.5}
                        stroke={colors.zinc[400]}
                        fill="none"
                        color={colors.zinc[400]}
                      />
                    ) : (
                      <Eye
                        size={20}
                        strokeWidth={1.5}
                        stroke={colors.zinc[400]}
                        fill="none"
                        color={colors.zinc[400]}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mr-6 items-end">
                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text className="font-product text-sm text-zinc-500">
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>

              <TouchableOpacity
                onPress={onSignInPress}
                className="m-4 items-center rounded-lg bg-zinc-800 py-4"
              >
                <Text className="font-product text-base text-white">
                  Sign In
                </Text>
              </TouchableOpacity>

              <View className="mb-6 flex-row items-center justify-center gap-2">
                <Text className="font-product text-base text-zinc-500">
                  Don't have an account?
                </Text>
                <Link href="/(auth)/sign-up" asChild>
                  <TouchableOpacity>
                    <Text className="font-product text-base text-zinc-700">
                      Sign up
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
