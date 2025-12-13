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
import * as Notifications from 'expo-notifications';

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

  // Permission state
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [permissionLoading, setPermissionLoading] = useState<boolean>(true);

  // Setup notification handler on mount
  useEffect(() => {
    setupNotificationHandler();
  }, []);

  // Check permission status
  const checkPermissionStatus = async () => {
    try {
      setPermissionLoading(true);
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionGranted(status === 'granted');
      logger.info(`Permission status checked: ${status}`);
    } catch (err) {
      logger.error(`Failed to check permission status: ${err}`);
      setPermissionGranted(false);
    } finally {
      setPermissionLoading(false);
    }
  };

  // Check permissions on mount
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  // Register for push notifications on mount (only if permissions granted)
  useEffect(() => {
    if (!permissionGranted) return;

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
  }, [permissionGranted]);

  // Request permission function
  const requestPermission = async (): Promise<boolean> => {
    try {
      setPermissionLoading(true);

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      logger.info(`Existing permission: ${existingStatus}`);

      // If already granted, return true
      if (existingStatus === 'granted') {
        setPermissionGranted(true);
        setPermissionLoading(false);
        return true;
      }

      // If denied, can't request again - must use settings
      if (existingStatus === 'denied') {
        logger.warn('Permission denied, must enable in settings');
        setPermissionGranted(false);
        setPermissionLoading(false);
        return false;
      }

      // Request permission
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';

      setPermissionGranted(granted);
      logger.info(`Permission ${granted ? 'granted' : 'denied'}`);

      return granted;
    } catch (err) {
      logger.error(`Failed to request permission: ${err}`);
      setPermissionGranted(false);
      return false;
    } finally {
      setPermissionLoading(false);
    }
  };

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
      value={{
        expoPushToken,
        error,
        isLoading,
        registerToken,
        permissionGranted,
        permissionLoading,
        requestPermission,
        checkPermissionStatus,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
