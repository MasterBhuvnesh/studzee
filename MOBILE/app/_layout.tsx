import { LoadingScreen } from '@/components/global/LoadingScreen';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { useCustomFonts } from '@/hooks/useCustomFonts';
import '@/styles/global.css';
import logger from '@/utils/logger';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Slot, SplashScreen, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env'
  );
}

function RootLayoutNav() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Track if we've already navigated to prevent loops
  const navigationAttempted = useRef(false);

  useEffect(() => {
    // Wait for auth to load
    if (!authLoaded) {
      logger.debug('Waiting for auth initialization...');
      return;
    }

    // Get current route group
    const inAuth = segments[0] === '(auth)';
    const inTabs = segments[0] === '(tabs)';
    const inScreens = segments[0] === 'screens';

    // Skip navigation for standalone screens
    if (inScreens) {
      logger.debug('In standalone screen, skipping navigation');
      return;
    }

    // Log current state
    logger.info(`Navigation State: 
      - Signed In: ${isSignedIn}
      - Current Route: ${segments.join('/')}
      - Navigation Attempted: ${navigationAttempted.current}
    `);

    /**
     * Navigation Priority:
     * 1. If signed in -> Go to tabs
     * 2. If not signed in -> Go to auth (which starts at onboarding)
     */

    let targetRoute: string | null = null;

    if (isSignedIn) {
      // User is authenticated - always go to tabs
      if (!inTabs) {
        targetRoute = '/(tabs)';
        logger.info('User signed in, navigating to tabs');
      }
    } else {
      // User is not signed in - go to auth (starts at onboarding)
      if (!inAuth) {
        targetRoute = '/(auth)/onboarding';
        logger.info('User not signed in, navigating to auth');
      }
    }

    // Perform navigation if needed and not already attempted
    if (targetRoute && !navigationAttempted.current) {
      navigationAttempted.current = true;

      // Use setTimeout to avoid navigation during render
      const timeoutId = setTimeout(() => {
        logger.success(`Navigating to: ${targetRoute}`);
        router.replace(targetRoute as any);

        // Reset flag after navigation completes
        setTimeout(() => {
          navigationAttempted.current = false;
        }, 1000);
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isSignedIn, authLoaded, segments, router]);

  // Show loading screen while initializing
  if (!authLoaded) {
    return <LoadingScreen />;
  }

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
          <NotificationProvider>
            <BottomSheetModalProvider>
              <RootLayoutNav />
            </BottomSheetModalProvider>
          </NotificationProvider>
        </SafeAreaProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
