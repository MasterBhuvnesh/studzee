export interface NotificationContextType {
  expoPushToken: string | null;
  error: Error | null;
  isLoading: boolean;
  registerToken: () => Promise<void>;
  // Permission management
  permissionGranted: boolean;
  permissionLoading: boolean;
  requestPermission: () => Promise<boolean>;
  checkPermissionStatus: () => Promise<void>;
}

/**
 * Response from POST /notifications/register.
 *
 * The merged backend returns a summary rather than the stored row, so the
 * Clerk ID and the raw token list are no longer sent back to the client.
 */
export interface BackendTokenResponse {
  message: string;
  data: {
    id: string;
    email: string;
    /** Number of devices currently registered for this user. */
    devices: number;
  };
}

export interface NotificationPermissionStatus {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain?: boolean;
}
