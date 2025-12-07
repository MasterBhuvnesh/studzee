import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import React from "react";
import { colors } from "@/constants/colors";

export default function ForgotPasswordScreen() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [error, setError] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");

  const onRequestReset = async () => {
    if (!isLoaded) return;
    setError("");
    setSuccessMessage("");

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: emailAddress,
      });

      setSuccessMessage(
        "A password reset code has been sent to your email address."
      );

      // Navigate to reset password screen after a short delay
      setTimeout(() => {
        router.push({
          pathname: "/(auth)/reset-password",
          params: { email: emailAddress },
        });
      }, 2000);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || "Failed to send reset code");
    }
  };

  return (
    <View className="flex-1 bg-zinc-50 px-6 justify-center">
      <Text className="text-4xl font-product-bold text-zinc-900 mb-2">
        Forgot Password?
      </Text>
      <Text className="text-zinc-600 text-base mb-8">
        Enter your email address and we'll send you a code to reset your
        password.
      </Text>

      {error ? (
        <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <Text className="text-red-800 text-sm">{error}</Text>
        </View>
      ) : null}

      {successMessage ? (
        <View className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <Text className="text-green-800 text-sm">{successMessage}</Text>
        </View>
      ) : null}

      <TextInput
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Email address"
        onChangeText={setEmailAddress}
        keyboardType="email-address"
        className="bg-white border border-zinc-200 rounded-lg px-4 py-3 mb-6 text-zinc-900"
        placeholderTextColor={colors.zinc[400]}
      />

      <TouchableOpacity
        onPress={onRequestReset}
        className="bg-zinc-900 rounded-lg py-4 items-center mb-4"
      >
        <Text className="text-white font-product-bold text-base">
          Send Reset Code
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
        className="items-center py-2"
      >
        <Text className="text-zinc-600 text-sm">Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}
