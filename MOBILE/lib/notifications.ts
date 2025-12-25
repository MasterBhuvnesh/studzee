import axios, { type AxiosError } from 'axios';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { BackendTokenResponse } from '@/types/notification';
import logger from '@/utils/logger';

// Backend API configuration
const NOTIFICATION_API_URL = `${process.env.EXPO_PUBLIC_BACKEND_API_URL}/register-token`;
const API_AUTH_TOKEN = process.env.EXPO_PUBLIC_API_AUTH_TOKEN;

/**
 * Configures the default notification handler for the app
 * This determines how notifications are displayed when the app is in the foreground
 */
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Sets up the default notification channel for Android
 * Required for Android 8.0 (API level 26) and above
 */
async function setupAndroidNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

/**
 * Registers the Expo push token with the backend API
 * @param token - The Expo push token to register
 * @returns Promise with backend response
 */
export async function registerTokenWithBackend(
  token: string
): Promise<BackendTokenResponse> {
  try {
    logger.info(`Registering token with backend: ${token}`);

    const response = await axios.post<BackendTokenResponse>(
      NOTIFICATION_API_URL,
      {
        token,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_AUTH_TOKEN}`,
        },
        timeout: 10000, // 10 second timeout
      }
    );

    logger.success(
      `Token registered successfully: ${JSON.stringify(response.data)}`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // TypeScript now knows error is AxiosError
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message || axiosError.message;

      logger.error(
        `Backend registration error - Status: ${axiosError.response?.status}, Message: ${errorMessage}`
      );

      throw new Error(errorMessage || 'Failed to register token with backend');
    }

    logger.error(`Unexpected error during registration: ${error}`);
    throw error;
  }
}

/**
 * Requests notification permissions and retrieves the Expo push token
 * Only works on physical devices
 * @returns The Expo push token or undefined if registration fails
 */
export async function registerForPushNotificationsAsync(): Promise<
  string | undefined
> {
  logger.info('registerForPushNotificationsAsync called');

  // Setup Android notification channel first
  await setupAndroidNotificationChannel();

  // Check if running on a physical device
  if (!Device.isDevice) {
    logger.warn('Not a physical device');
    if (Platform.OS !== 'web') {
      logger.info(
        'Push notifications only work on physical devices, not simulators/emulators'
      );
    }
    return;
  }

  try {
    // Check existing permission status
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    logger.info(`Existing permission status: ${existingStatus}`);

    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      logger.info(`Requested permission status: ${status}`);
    }

    // Check if permission was granted
    if (finalStatus !== 'granted') {
      logger.warn('Permission not granted');
      throw new Error('Notification permission not granted');
    }

    // Get the Expo project ID
    const projectId =
      (Constants?.expoConfig?.extra?.eas as { projectId?: string })
        ?.projectId ??
      (Constants?.easConfig as { projectId?: string })?.projectId;

    if (!projectId) {
      logger.error('Project ID not found in constants');
      throw new Error('Project ID not found. Please check your configuration.');
    }

    // Get the Expo push token
    const response = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = response.data;
    logger.success(`Expo Push Token: ${token}`);

    // Register token with backend
    try {
      await registerTokenWithBackend(token);
    } catch (backendError) {
      logger.warn(
        `Token obtained but backend registration failed: ${backendError}`
      );
      // Don't throw here - we still want to return the token
      // The app can still use it, even if backend registration failed
    }

    return token;
  } catch (error: unknown) {
    logger.fatal(`Error getting push token: ${error}`);
    throw error;
  }
}

/**
 * Checks the current notification permission status
 * @returns The permission status
 */
export async function getNotificationPermissionStatus() {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return { status, canAskAgain };
}
