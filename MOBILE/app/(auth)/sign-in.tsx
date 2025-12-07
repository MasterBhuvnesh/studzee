import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import React from "react";
import { colors } from "@/constants/colors";
import OAuthButtons from "@/components/auth/OAuthButtons";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;
    setError("");

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(tabs)");
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
        setError("Sign-in incomplete. Please try again.");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || "Sign-in failed");
    }
  };

  return (
    <ScrollView className="flex-1 bg-zinc-50">
      <View className="px-6 pt-16 pb-8">
        <Text className="text-4xl font-product-bold text-zinc-900 mb-2">
          Welcome Back
        </Text>
        <Text className="text-zinc-600 text-base mb-8">
          Sign in to continue
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

        <View className="gap-4 mb-4">
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

        <View className="items-end mb-6">
          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity>
              <Text className="text-zinc-600 text-sm">Forgot password?</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <TouchableOpacity
          onPress={onSignInPress}
          className="bg-zinc-900 rounded-lg py-4 items-center mb-6"
        >
          <Text className="text-white font-product-bold text-base">
            Sign In
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center items-center gap-2">
          <Text className="text-zinc-600">Don't have an account?</Text>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity>
              <Text className="text-zinc-900 font-product-bold">Sign up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
