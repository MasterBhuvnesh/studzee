import logger from '@/utils/logger';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

const ONBOARDING_KEY = 'hasCompletedOnboarding';

interface OnboardingState {
  hasCompletedOnboarding: boolean | null;
  isLoading: boolean;
  error: Error | null;
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>({
    hasCompletedOnboarding: null,
    isLoading: true,
    error: null,
  });

  // Load onboarding status once on mount
  useEffect(() => {
    let isMounted = true;

    const loadOnboardingStatus = async () => {
      try {
        logger.info('Loading onboarding status...');
        const value = await SecureStore.getItemAsync(ONBOARDING_KEY);

        if (isMounted) {
          const completed = value === 'true';
          setState({
            hasCompletedOnboarding: completed,
            isLoading: false,
            error: null,
          });
          logger.success(`Onboarding status loaded: ${completed}`);
        }
      } catch (error) {
        logger.error(`Error loading onboarding status: ${error}`);
        if (isMounted) {
          setState({
            hasCompletedOnboarding: false,
            isLoading: false,
            error: error instanceof Error ? error : new Error('Unknown error'),
          });
        }
      }
    };

    loadOnboardingStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  // Memoized function to complete onboarding
  const completeOnboarding = useCallback(async () => {
    try {
      logger.info('Marking onboarding as completed...');
      await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');

      setState(prev => ({
        ...prev,
        hasCompletedOnboarding: true,
        error: null,
      }));

      logger.success('Onboarding marked as completed');
    } catch (error) {
      logger.error(`Error saving onboarding status: ${error}`);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
      throw error;
    }
  }, []);

  // Optional: Function to reset onboarding (useful for testing)
  const resetOnboarding = useCallback(async () => {
    try {
      logger.info('Resetting onboarding status...');
      await SecureStore.deleteItemAsync(ONBOARDING_KEY);

      setState({
        hasCompletedOnboarding: false,
        isLoading: false,
        error: null,
      });

      logger.success('Onboarding reset successfully');
    } catch (error) {
      logger.error(`Error resetting onboarding: ${error}`);
      throw error;
    }
  }, []);

  return {
    hasCompletedOnboarding: state.hasCompletedOnboarding,
    isLoading: state.isLoading,
    error: state.error,
    completeOnboarding,
    resetOnboarding,
  };
}
