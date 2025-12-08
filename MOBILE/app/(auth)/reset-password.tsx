import { colors } from '@/constants/colors';
import logger from '@/utils/logger';
import { useSignIn } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [code, setCode] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const { signIn, setActive, isLoaded } = useSignIn();
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
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
        logger.success('Password reset successful');
      } else {
        setError('Password reset incomplete. Please try again.');
      }
    } catch (err: any) {
      logger.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'Failed to reset password');
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
                Reset Password
              </Text>
              <Text className="mb-8 font-product text-base text-zinc-500">
                Enter the code and your new password for{' '}
                <Text className="font-product  text-base  text-zinc-700">
                  {email}
                </Text>
              </Text>

              {error ? (
                <View className="mb-4 flex-row items-center rounded-lg border border-red-200 bg-red-50 p-3">
                  <BanIcon
                    size={16}
                    color={colors.red[500]}
                    strokeWidth={1.5}
                    stroke={colors.red[500]}
                    fill="none"
                  />
                  <Text className="ml-2 mr-2 font-sans text-sm text-red-500">
                    {error}
                  </Text>
                </View>
              ) : null}

              <View className="mb-6 gap-4">
                <TextInput
                  value={code}
                  placeholder="Verification code"
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-3 font-product text-zinc-700"
                  placeholderTextColor={colors.zinc[400]}
                />
                <View className="relative">
                  <TextInput
                    value={password}
                    placeholder="New password"
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
                <View className="relative">
                  <TextInput
                    value={confirmPassword}
                    placeholder="Confirm new password"
                    secureTextEntry={!showConfirmPassword}
                    onChangeText={setConfirmPassword}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-3 pr-12 font-product text-zinc-700"
                    placeholderTextColor={colors.zinc[400]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3"
                  >
                    {showConfirmPassword ? (
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

              <TouchableOpacity
                onPress={onResetPassword}
                className="mb-4 items-center rounded-lg bg-zinc-800 py-4"
              >
                <Text className="font-product text-base text-white">
                  Reset Password
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.back()}
                className="items-center py-2"
              >
                <Text className="font-product text-sm text-zinc-500">Back</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
