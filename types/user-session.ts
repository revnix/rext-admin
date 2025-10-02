/**
 * User Session Types
 *
 * Types for managing user authentication sessions across devices.
 * Separate from topic generation sessions (types/session.ts).
 */

export interface UserSession {
  id: string;
  user_id: string;
  device_name: string | null; // e.g., "Chrome on Windows"
  device_type: string | null; // "desktop" | "mobile" | "tablet"
  ip_address: string | null;
  country: string | null;
  city: string | null;
  is_active: boolean;
  is_current: boolean; // True for the current session
  created_at: string; // ISO timestamp
  last_activity_at: string; // ISO timestamp
  expires_at: string; // ISO timestamp
}

export interface SessionListResponse {
  sessions: UserSession[];
  total_count: number;
  active_count: number;
}

export interface RevokeSessionRequest {
  session_id: string;
}

export interface RevokeAllSessionsRequest {
  exclude_current: boolean;
}

export interface RevokeSessionResponse {
  session_id: string;
  revoked: boolean;
}

export interface RevokeAllSessionsResponse {
  revoked_count: number;
  current_session_preserved: boolean;
}
