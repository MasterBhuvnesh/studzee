import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

import logger from '@/utils/logger';

const ONBOARDING_KEY = 'hasCompletedOnboarding';

export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<
    boolean | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOnboardingStatus();
  }, []);

  const loadOnboardingStatus = async () => {
    try {
      const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
      setHasCompletedOnboarding(value === 'true');
    } catch (error) {
      logger.error('Error loading onboarding status: ' + error);
      setHasCompletedOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      logger.error('Error saving onboarding status: ' + error);
    }
  };

  return {
    hasCompletedOnboarding,
    isLoading,
    completeOnboarding,
  };
}
