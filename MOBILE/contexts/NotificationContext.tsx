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

  // Setup notification handler on mount
  useEffect(() => {
    setupNotificationHandler();
  }, []);

  // Automatically register for push notifications on mount
  useEffect(() => {
    logger.info('NotificationProvider mounted, requesting permissions...');

    registerForPushNotificationsAsync()
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
  }, []);

  return (
    <NotificationContext.Provider value={{ expoPushToken, error, isLoading }}>
      {children}
    </NotificationContext.Provider>
  );
};
