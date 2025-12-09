import { useSSO } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { OAuthButtonsProps, OAuthProvider } from '@/types';
import logger from '@/utils/logger';

export default function OAuthButtons({ onError }: OAuthButtonsProps) {
  const router = useRouter();
  const { startSSOFlow: startGoogleSSO } = useSSO();
  const { startSSOFlow: startGithubSSO } = useSSO();

  const onSSOPress = async (provider: OAuthProvider) => {
    try {
      const startSSO =
        provider === 'oauth_google' ? startGoogleSSO : startGithubSSO;

      const { createdSessionId, setActive: setActiveSession } = await startSSO({
        strategy: provider,
        redirectUrl: AuthSession.makeRedirectUri({
          scheme: 'studzee',
          path: '/',
        }),
      });

      if (createdSessionId) {
        setActiveSession!({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      logger.error('SSO error: ' + err);
      onError(
        err.errors?.[0]?.message ||
          `${provider === 'oauth_google' ? 'Google' : 'GitHub'} authentication failed`
      );
    }
  };

  return (
    <View className="flex-row gap-4 px-4">
      <TouchableOpacity
        onPress={() => onSSOPress('oauth_google')}
        className="flex-1 flex-row items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 py-3"
      >
        <Image
          source={require('@/assets/images/google.svg')}
          style={{ width: 24, height: 24 }}
          contentFit="cover"
        />
        <Text className="font-product text-base text-zinc-500">Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onSSOPress('oauth_github')}
        className="flex-1 flex-row items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 py-3"
      >
        <Image
          source={require('@/assets/images/github.svg')}
          style={{ width: 24, height: 24 }}
          contentFit="cover"
        />
        <Text className="font-product text-base text-zinc-500">GitHub</Text>
      </TouchableOpacity>
    </View>
  );
}
