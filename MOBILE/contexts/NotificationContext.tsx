import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useAuth, useUser } from '@clerk/clerk-expo';

import {
  registerForPushNotificationsAsync,
  setupNotificationHandler,
} from '@/lib/notifications';
import logger from '@/utils/logger';

interface NotificationContextType {
  expoPushToken: string | null;
  error: Error | null;
  isLoading: boolean;
  registerToken: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { getToken } = useAuth();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  // Clerk does not guarantee getToken is referentially stable across
  // renders. Reading it through a ref keeps registerToken's identity tied to
  // email alone, so the auto-register effect below fires only on an actual
  // login/logout rather than on every render this provider causes itself.
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  // Setup notification handler on mount
  useEffect(() => {
    setupNotificationHandler();
  }, []);

  // Shared by the automatic registration below and by callers (for example
  // useNotificationPermissions) that need to re-register after the user
  // grants permission explicitly, rather than waiting for this effect.
  const registerToken = useCallback(async () => {
    if (!email) {
      logger.info('User not available yet, skipping notification registration');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const token = await registerForPushNotificationsAsync(email, () =>
        getTokenRef.current()
      );
      setExpoPushToken(token ?? null);
      setIsLoading(false);
      if (token) {
        logger.success('Push notification registration successful');
      }
    } catch (err) {
      const errorObj =
        err instanceof Error ? err : new Error('Unknown error occurred');
      setError(errorObj);
      setIsLoading(false);
      logger.error(`Push notification registration failed: ${err}`);
      throw errorObj;
    }
  }, [email]);

  // Automatically register for push notifications when the signed-in email
  // changes. Depends on registerToken, but registerToken's identity now only
  // changes with email, so this does not refire on unrelated re-renders.
  useEffect(() => {
    logger.info('NotificationProvider mounted, requesting permissions...');
    registerToken().catch(() => {
      // Already logged inside registerToken. Nothing else to do on mount.
    });
  }, [registerToken]);

  return (
    <NotificationContext.Provider
      value={{ expoPushToken, error, isLoading, registerToken }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
