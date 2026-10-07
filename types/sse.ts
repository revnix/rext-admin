/**
 * Shared Server-Sent Events (SSE) types used across the frontend.
 *
 * These interfaces reflect the backend `OperationEvent` schema emitted by the
 * SSE service (see `rext-backend`'s `src/services/sse_service.py`).
 */

export const SSE_EVENT_STATUSES = [
  "connected",
  "started",
  "progress",
  "completed",
  "failed",
  "info",
] as const;

export type SSEEventStatus = (typeof SSE_EVENT_STATUSES)[number];

export interface SSEEvent {
  id: string;
  operation_id: string;
  scope: string;
  step: string;
  status: SSEEventStatus;
  message: string;
  progress?: number;
  payload?: Record<string, unknown>;
  timestamp: string;
}

export const SSE_ERROR_CODES = {
  OPERATION_COMPLETED: "OPERATION_COMPLETED",
  CONNECTION_LOST: "CONNECTION_LOST",
  RETRYING: "RETRYING",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  CONNECTION_ESTABLISHED: "CONNECTION_ESTABLISHED",
} as const;

export interface SSEConnectionStatus {
  connected: boolean;
  retryCount: number;
  error?: string;
  code?: keyof typeof SSE_ERROR_CODES | string;
}

export type OperationNotificationType =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "system"
  | "user";

export interface OperationNotificationAction {
  label: string;
  variant?: "default" | "outline" | "secondary" | "destructive";
  onClick?: () => void;
}

export interface OperationNotification {
  id: string;
  operationId?: string;
  title: string;
  message: string;
  type: OperationNotificationType;
  createdAt: string;
  read: boolean;
  actions?: OperationNotificationAction[];
  metadata?: Record<string, unknown>;
}
