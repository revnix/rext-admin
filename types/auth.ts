/**
 * Authentication-specific types
 */

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
