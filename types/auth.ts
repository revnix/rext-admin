/**
 * Authentication-specific types
 */

/**
 * Extended JWT token with refresh token support
 */
export interface ExtendedJWT {
  id?: string;
  email?: string;
  name?: string;
  picture?: string | null;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number; // Timestamp when access token expires
  rememberMe?: boolean;
  error?: string; // Error code if token refresh fails
}

/**
 * Token refresh response from backend
 */
export interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
}

/**
 * Session activity tracking
 */
export interface SessionActivity {
  lastActivity: number; // Timestamp of last user interaction
  sessionStart: number; // Timestamp when session started
  activityCount: number; // Number of interactions in this session
}

/**
 * Device session info (stored client-side)
 */
export interface DeviceSession {
  id: string;
  deviceName: string; // e.g., "Chrome on macOS"
  browser: string;
  os: string;
  lastActivity: number;
  loginTime: number;
}
