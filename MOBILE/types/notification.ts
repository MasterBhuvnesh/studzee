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

export interface BackendTokenResponse {
  success: boolean;
  message?: string;
  token?: string;
}

export interface NotificationPermissionStatus {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain?: boolean;
}
