/**
 * Shared Server-Sent Events (SSE) types used across the frontend.
 *
 * These interfaces reflect the backend `OperationEvent` schema emitted by the
 * SSE service (see `wrext-backend/src/services/sse_service.py`).
 */

export type SSEEventStatus =
  | "connected"
  | "started"
  | "progress"
  | "completed"
  | "failed"
  | "info";

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

export interface SSEConnectionStatus {
  connected: boolean;
  retryCount: number;
  error?: string;
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
