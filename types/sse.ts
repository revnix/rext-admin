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
