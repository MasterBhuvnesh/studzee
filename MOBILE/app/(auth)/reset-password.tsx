import { useSignIn } from "@clerk/clerk-expo";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import React from "react";
import { colors } from "@/constants/colors";

export default function ResetPasswordScreen() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const onResetPassword = async () => {
    if (!isLoaded) return;
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result.status === "complete") {
        // Password reset successful
        router.replace("/(auth)/sign-in");
      } else {
        setError("Password reset incomplete. Please try again.");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || "Failed to reset password");
    }
  };

  return (
    <View className="flex-1 bg-zinc-50 px-6 justify-center">
      <Text className="text-4xl font-product-bold text-zinc-900 mb-2">
        Reset Password
      </Text>
      <Text className="text-zinc-600 text-base mb-8">
        Enter the code sent to {email} and your new password.
      </Text>

      {error ? (
        <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <Text className="text-red-800 text-sm">{error}</Text>
        </View>
      ) : null}

      <View className="gap-4 mb-6">
        <TextInput
          value={code}
          placeholder="Verification code"
          onChangeText={setCode}
          keyboardType="number-pad"
          className="bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900"
          placeholderTextColor={colors.zinc[400]}
        />
        <TextInput
          value={password}
          placeholder="New password"
          secureTextEntry={true}
          onChangeText={setPassword}
          className="bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900"
          placeholderTextColor={colors.zinc[400]}
        />
        <TextInput
          value={confirmPassword}
          placeholder="Confirm new password"
          secureTextEntry={true}
          onChangeText={setConfirmPassword}
          className="bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900"
          placeholderTextColor={colors.zinc[400]}
        />
      </View>

      <TouchableOpacity
        onPress={onResetPassword}
        className="bg-zinc-900 rounded-lg py-4 items-center mb-4"
      >
        <Text className="text-white font-product-bold text-base">
          Reset Password
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
        className="items-center py-2"
      >
        <Text className="text-zinc-600 text-sm">Back</Text>
      </TouchableOpacity>
    </View>
  );
}
