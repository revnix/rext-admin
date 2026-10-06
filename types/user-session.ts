/**
 * User Session Types
 *
 * Types for managing user authentication sessions across devices.
 */

export type DeviceType = "desktop" | "mobile" | "tablet";

export interface UserSession {
  id: string;
  device_name: string | null;
  device_type: DeviceType | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
  last_activity_at: string | null;
  is_current: boolean;
  // Optional extension fields
  user_id?: string;
  country?: string | null;
  city?: string | null;
  is_active?: boolean;
  expires_at?: string | null;
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
  success?: boolean;
  message?: string;
}

export interface RevokeAllSessionsResponse {
  revoked_count: number;
  current_session_preserved: boolean;
  success?: boolean;
  message?: string;
}
