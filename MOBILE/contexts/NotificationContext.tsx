import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
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

  // Setup notification handler on mount
  useEffect(() => {
    setupNotificationHandler();
  }, []);

  // Automatically register for push notifications when user is available
  useEffect(() => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      logger.info('User not available yet, skipping notification registration');
      setIsLoading(false);
      return;
    }

    logger.info('NotificationProvider mounted, requesting permissions...');

    registerForPushNotificationsAsync(
      user.primaryEmailAddress.emailAddress,
      getToken
    )
      .then(token => {
        setExpoPushToken(token ?? null);
        setIsLoading(false);
        if (token) {
          logger.success('Push notification registration successful');
        }
      })
      .catch(err => {
        const errorObj =
          err instanceof Error ? err : new Error('Unknown error occurred');
        setError(errorObj);
        setIsLoading(false);
        logger.error(`Push notification registration failed: ${err}`);
      });
  }, [user, getToken]);

  return (
    <NotificationContext.Provider value={{ expoPushToken, error, isLoading }}>
      {children}
    </NotificationContext.Provider>
  );
};
