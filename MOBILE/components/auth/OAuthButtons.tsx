import { useSSO } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import React from "react";
import * as AuthSession from "expo-auth-session";

interface OAuthButtonsProps {
  onError: (error: string) => void;
}

export default function OAuthButtons({ onError }: OAuthButtonsProps) {
  const router = useRouter();
  const { startSSOFlow: startGoogleSSO } = useSSO();
  const { startSSOFlow: startGithubSSO } = useSSO();

  const onSSOPress = async (provider: "oauth_google" | "oauth_github") => {
    try {
      const startSSO =
        provider === "oauth_google" ? startGoogleSSO : startGithubSSO;

      const { createdSessionId, setActive: setActiveSession } = await startSSO({
        strategy: provider,
        redirectUrl: AuthSession.makeRedirectUri({
          scheme: "studzee",
          path: "/",
        }),
      });

      if (createdSessionId) {
        setActiveSession!({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      console.error("SSO error:", err);
      onError(
        err.errors?.[0]?.message ||
          `${provider === "oauth_google" ? "Google" : "GitHub"} authentication failed`
      );
    }
  };

  return (
    <View className="gap-4">
      <TouchableOpacity
        onPress={() => onSSOPress("oauth_google")}
        className="bg-white border border-zinc-200 rounded-lg py-4 flex-row items-center justify-center gap-3"
      >
        <Text className="text-zinc-900 font-product text-base">
          Continue with Google
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onSSOPress("oauth_github")}
        className="bg-zinc-900 border border-zinc-900 rounded-lg py-4 flex-row items-center justify-center gap-3"
      >
        <Text className="text-white font-product text-base">
          Continue with GitHub
        </Text>
      </TouchableOpacity>
    </View>
  );
}
