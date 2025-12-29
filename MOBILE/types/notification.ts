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
  message: string;
  data: {
    id: string;
    clerkId: string;
    email: string;
    expoTokens: string[];
    createdAt: string;
    updatedAt: string;
  };
}

export interface NotificationPermissionStatus {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain?: boolean;
}
