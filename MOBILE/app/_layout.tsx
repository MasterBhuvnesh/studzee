import { LoadingScreen } from '@/components/LoadingScreen';
import { useCustomFonts } from '@/hooks/useCustomFonts';
import { useOnboarding } from '@/hooks/useOnboarding';
import '@/styles/global.css';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Slot, SplashScreen, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env'
  );
}

function RootLayoutNav() {
  const { isSignedIn, isLoaded } = useAuth();
  const { hasCompletedOnboarding, isLoading } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || isLoading) return;

    const inOnboarding = segments[0] === '(onboarding)';
    const inAuth = segments[0] === '(auth)';
    const inTabs = segments[0] === '(tabs)';

    // If not completed onboarding, redirect to onboarding
    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace('/(onboarding)' as any);
    }
    // If completed onboarding but not signed in, redirect to auth
    else if (hasCompletedOnboarding && !isSignedIn && !inAuth) {
      router.replace('/(auth)/sign-in');
    }
    // If signed in, redirect to tabs
    else if (isSignedIn && !inTabs) {
      router.replace('/(tabs)');
    }
  }, [isSignedIn, isLoaded, hasCompletedOnboarding, isLoading]);

  return <Slot />;
}

export default function RootLayout() {
  const { fontsLoaded, fontError } = useCustomFonts();

  if (!fontsLoaded && !fontError) {
    return <LoadingScreen />;
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <SafeAreaProvider>
        <RootLayoutNav />
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
