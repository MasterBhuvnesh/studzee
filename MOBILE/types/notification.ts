export interface NotificationContextType {
  expoPushToken: string | null;
  error: Error | null;
  isLoading: boolean;
  registerToken: () => Promise<void>;
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
