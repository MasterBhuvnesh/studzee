import * as React from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { colors } from "@/constants/colors";
import OAuthButtons from "@/components/auth/OAuthButtons";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setError("");

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || "Sign-up failed");
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setError("");

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/(tabs)");
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || "Verification failed");
    }
  };

  if (pendingVerification) {
    return (
      <View className="flex-1 bg-zinc-50 px-6 justify-center">
        <Text className="text-3xl font-product-bold text-zinc-900 mb-2">
          Verify your email
        </Text>
        <Text className="text-zinc-600 mb-8">
          We sent a verification code to {emailAddress}
        </Text>

        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <Text className="text-red-800 text-sm">{error}</Text>
          </View>
        ) : null}

        <TextInput
          value={code}
          placeholder="Enter verification code"
          onChangeText={setCode}
          keyboardType="number-pad"
          className="bg-white border border-zinc-200 rounded-lg px-4 py-3 mb-4 text-zinc-900"
          placeholderTextColor={colors.zinc[400]}
        />

        <TouchableOpacity
          onPress={onVerifyPress}
          className="bg-zinc-900 rounded-lg py-4 items-center mb-4"
        >
          <Text className="text-white font-product-bold text-base">Verify</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-zinc-50">
      <View className="px-6 pt-16 pb-8">
        <Text className="text-4xl font-product-bold text-zinc-900 mb-2">
          Create Account
        </Text>
        <Text className="text-zinc-600 text-base mb-8">
          Sign up to get started
        </Text>

        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <Text className="text-red-800 text-sm">{error}</Text>
          </View>
        ) : null}

        <View className="mb-6">
          <OAuthButtons onError={setError} />
        </View>

        <View className="flex-row items-center gap-4 mb-6">
          <View className="flex-1 h-px bg-zinc-200" />
          <Text className="text-zinc-500 text-sm">or</Text>
          <View className="flex-1 h-px bg-zinc-200" />
        </View>

        <View className="gap-4 mb-6">
          <TextInput
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Email address"
            onChangeText={setEmailAddress}
            keyboardType="email-address"
            className="bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900"
            placeholderTextColor={colors.zinc[400]}
          />
          <TextInput
            value={password}
            placeholder="Password"
            secureTextEntry={true}
            onChangeText={setPassword}
            className="bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900"
            placeholderTextColor={colors.zinc[400]}
          />
        </View>

        <TouchableOpacity
          onPress={onSignUpPress}
          className="bg-zinc-900 rounded-lg py-4 items-center mb-6"
        >
          <Text className="text-white font-product-bold text-base">
            Create Account
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center items-center gap-2">
          <Text className="text-zinc-600">Already have an account?</Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity>
              <Text className="text-zinc-900 font-product-bold">Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
