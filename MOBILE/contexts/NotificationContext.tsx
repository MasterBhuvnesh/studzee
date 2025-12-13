import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  registerForPushNotificationsAsync,
  setupNotificationHandler,
} from '@/lib/notifications';
import type { NotificationContextType } from '@/types/notification';
import logger from '@/utils/logger';

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

  // Setup notification handler on mount
  useEffect(() => {
    setupNotificationHandler();
  }, []);

  // Register for push notifications on mount
  useEffect(() => {
    const registerNotifications = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = await registerForPushNotificationsAsync();

        if (token) {
          setExpoPushToken(token);
        }
      } catch (err) {
        logger.error(`Failed to register for push notifications: ${err}`);
        setError(
          err instanceof Error ? err : new Error('Unknown error occurred')
        );
      } finally {
        setIsLoading(false);
      }
    };

    registerNotifications();
  }, []);

  // Manual registration function (can be used to retry)
  const registerToken = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await registerForPushNotificationsAsync();

      if (token) {
        setExpoPushToken(token);
      }
    } catch (err) {
      logger.error(`Failed to register for push notifications: ${err}`);
      setError(
        err instanceof Error ? err : new Error('Unknown error occurred')
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NotificationContext.Provider
      value={{ expoPushToken, error, isLoading, registerToken }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
