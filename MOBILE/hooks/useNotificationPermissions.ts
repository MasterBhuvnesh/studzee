import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useNotification } from '@/contexts/NotificationContext';
import logger from '@/utils/logger';

export type NotificationPermissionStatus =
  | 'undetermined'
  | 'granted'
  | 'denied';

interface UseNotificationPermissionsResult {
  granted: boolean;
  /**
   * The raw tri-state. 'denied' must route the user to system settings rather
   * than a native prompt that can never be shown again, and 'undetermined'
   * means the prompt has simply never been answered.
   */
  status: NotificationPermissionStatus;
  loading: boolean;
  requestNotificationPermission: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
}

const toStatus = (
  osStatus: Notifications.PermissionStatus
): NotificationPermissionStatus =>
  osStatus === Notifications.PermissionStatus.GRANTED
    ? 'granted'
    : osStatus === Notifications.PermissionStatus.DENIED
      ? 'denied'
      : 'undetermined';

/**
 * Tracks OS notification permission for screens that need to act on it,
 * currently the Settings toggle. Permission can change outside the app, most
 * often right after the user flips it in system settings, so returning to the
 * foreground re-checks and completes the registration the automatic flow
 * skipped while permission was denied.
 */
export const useNotificationPermissions =
  (): UseNotificationPermissionsResult => {
    const {
      registerToken,
      expoPushToken,
      isLoading: registering,
    } = useNotification();
    const [status, setStatus] =
      useState<NotificationPermissionStatus>('undetermined');
    const [loading, setLoading] = useState(true);

    // Refs mirror everything the AppState listener reads, so a foreground
    // event never acts on values captured when the listener was attached.
    const statusRef = useRef(status);
    const tokenRef = useRef(expoPushToken);
    const registeringRef = useRef(registering);
    useEffect(() => {
      statusRef.current = status;
      tokenRef.current = expoPushToken;
      registeringRef.current = registering;
    }, [status, expoPushToken, registering]);

    const syncPermissions = useCallback(async () => {
      try {
        const { status: osStatus } = await Notifications.getPermissionsAsync();
        const next = toStatus(osStatus);
        setStatus(next);
        return next;
      } catch (error) {
        logger.error(`Failed to check notification permissions: ${error}`);
        return statusRef.current;
      }
    }, []);

    // Complete registration once permission exists but no token does. The
    // provider already logs its own failures; nothing to add here.
    const registerIfGranted = useCallback(async () => {
      if (!tokenRef.current && !registeringRef.current) {
        try {
          await registerToken();
          logger.success('Token registered after permission change');
        } catch (error) {
          logger.warn(
            `Permission granted but token registration failed: ${error}`
          );
        }
      }
    }, [registerToken]);

    useEffect(() => {
      void syncPermissions().finally(() => setLoading(false));
    }, [syncPermissions]);

    useEffect(() => {
      const subscription = AppState.addEventListener('change', next => {
        if (next !== 'active') return;
        void (async () => {
          const current = await syncPermissions();
          if (current === 'granted') await registerIfGranted();
        })();
      });
      return () => subscription.remove();
    }, [syncPermissions, registerIfGranted]);

    // Safe on an already decided permission: the OS resolves with the current
    // state instead of prompting again.
    const requestNotificationPermission = useCallback(async () => {
      setLoading(true);
      try {
        const { status: osStatus } =
          await Notifications.requestPermissionsAsync();
        const next = toStatus(osStatus);
        setStatus(next);
        if (next === 'granted') {
          logger.success('Notification permission granted');
          await registerIfGranted();
        } else {
          logger.warn(`Notification permission ${next}`);
        }
      } catch (error) {
        logger.error(`Failed to request notification permission: ${error}`);
      } finally {
        setLoading(false);
      }
    }, [registerIfGranted]);

    const refreshPermissions = useCallback(async () => {
      setLoading(true);
      try {
        await syncPermissions();
      } finally {
        setLoading(false);
      }
    }, [syncPermissions]);

    return {
      granted: status === 'granted',
      status,
      loading,
      requestNotificationPermission,
      refreshPermissions,
    };
  };
