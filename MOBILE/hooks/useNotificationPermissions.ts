import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';

import { useNotification } from '@/contexts/NotificationContext';
import logger from '@/utils/logger';

interface NotificationPermissionState {
  granted: boolean;
  loading: boolean;
}

interface NotificationPermissionHandlers {
  requestNotificationPermission: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
}

export const useNotificationPermissions = (): NotificationPermissionState &
  NotificationPermissionHandlers => {
  const { registerToken } = useNotification();
  const [permissions, setPermissions] = useState<NotificationPermissionState>({
    granted: false,
    loading: true,
  });

  const checkPermissions = useCallback(async () => {
    try {
      setPermissions(prev => ({ ...prev, loading: true }));
      const { status } = await Notifications.getPermissionsAsync();
      setPermissions({
        granted: status === 'granted',
        loading: false,
      });
      logger.info(`Notification permission status: ${status}`);
    } catch (error) {
      logger.error(`Failed to check notification permissions: ${error}`);
      setPermissions({ granted: false, loading: false });
    }
  }, []);

  // Automatically check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const requestNotificationPermission = async () => {
    try {
      setPermissions(prev => ({ ...prev, loading: true }));

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      logger.info(`Existing permission status: ${existingStatus}`);

      // If permission is already granted, just ensure token is registered
      if (existingStatus === 'granted') {
        logger.info(
          'Notification permission already granted, ensuring token is registered'
        );
        setPermissions({ granted: true, loading: false });

        // Try to register token even if already granted
        try {
          await registerToken();
          logger.success('Token registered successfully');
        } catch (error) {
          logger.warn(
            `Permission granted but token registration failed: ${error}`
          );
        }
        return;
      }

      // If permission was previously denied, can't request again - must go to settings
      if (existingStatus === 'denied') {
        logger.warn(
          'Notification permission was previously denied, user must enable in settings'
        );
        setPermissions({ granted: false, loading: false });

        // This will be caught by the component and shown as a settings prompt
        throw new Error('PERMISSION_DENIED');
      }

      // Request permissions if not granted (status is 'undetermined')
      logger.info('Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';

      setPermissions({ granted, loading: false });

      if (granted) {
        logger.success('Notification permission granted!');
        // Register token with backend after permission is granted
        try {
          await registerToken();
        } catch (error) {
          logger.warn(
            `Permission granted but token registration failed: ${error}`
          );
        }
      } else {
        logger.warn('Notification permission denied');
      }
    } catch (error) {
      logger.error(`Failed to request notification permission: ${error}`);
      setPermissions({ granted: false, loading: false });
    }
  };

  const refreshPermissions = async () => {
    await checkPermissions();
  };

  return {
    ...permissions,
    requestNotificationPermission,
    refreshPermissions,
  };
};
