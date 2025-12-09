/**
 * OAuth provider types supported by the application
 */
export type OAuthProvider = 'oauth_google' | 'oauth_github';

/**
 * Authentication error response
 */
export interface AuthError {
  message: string;
  code?: string;
  errors?: Array<{
    message: string;
    code?: string;
  }>;
}

/**
 * User authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
}
