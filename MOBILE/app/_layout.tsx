import { LoadingScreen } from '@/components/global/LoadingScreen';
import { useCustomFonts } from '@/hooks/useCustomFonts';
import { useOnboarding } from '@/hooks/useOnboarding';
import '@/styles/global.css';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Slot, SplashScreen, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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

    // Priority 1: If signed in, go to tabs (highest priority to prevent onboarding loop)
    if (isSignedIn && !inTabs) {
      router.replace('/(tabs)');
    }
    // Priority 2: If not completed onboarding, redirect to onboarding
    else if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace('/(onboarding)' as any);
    }
    // Priority 3: If completed onboarding but not signed in, redirect to auth
    else if (hasCompletedOnboarding && !isSignedIn && !inAuth) {
      router.replace('/(auth)/sign-in');
    }
  }, [isSignedIn, isLoaded, hasCompletedOnboarding, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  const { fontsLoaded, fontError } = useCustomFonts();

  if (!fontsLoaded && !fontError) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <RootLayoutNav />
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
