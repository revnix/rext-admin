/**
 * User Session Types
 *
 * Types for managing user authentication sessions across devices.
 * Separate from topic generation sessions (types/session.ts).
 */

import type { SessionItem } from "./generated/types.gen";

export type DeviceType = "desktop" | "mobile" | "tablet";

export interface UserSession extends SessionItem {
  device_name?: string | null;
  device_type?: DeviceType | null;
  // Non-nullable if SessionItem says so
  last_activity_at: string;
  // Optional extension fields
  country?: string | null;
  city?: string | null;
  is_active?: boolean;
}

export interface UserSessionListResponse {
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
