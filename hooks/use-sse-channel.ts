"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { log } from "@/lib/logger";
import { useSSE } from "@/providers/sse-provider";
import {
  type SSEConnectionStatus,
  type SSEEvent,
  SSE_ERROR_CODES,
} from "@/types/sse";
import { fetchNotifications } from "@/services/notification-api";
import { useNotificationStore } from "@/stores/notification-store";

const sseChannelLogger = log.forComponent("useSSEChannel");

export interface UseSSEChannelOptions {
  onEvent?: (event: SSEEvent) => void;
  onComplete?: (payload?: unknown) => void;
  onError?: (error: string) => void;
  autoConnect?: boolean;
}

export interface UseSSEChannelReturn {
  events: SSEEvent[];
  latestEvent: SSEEvent | null;
  status: SSEConnectionStatus;
  connect: () => void;
  disconnect: () => void;
  isConnected: boolean;
}

const COMPLETION_STEPS = new Set(["pipeline.completed", "success"]);
const FAILURE_STEPS = new Set(["pipeline.failed", "failed"]);

/**
 * Hook for subscribing to an SSE channel tied to an operation ID.
 * Manages lifecycle, connection status, and collected events.
 */
export function useSSEChannel(
  operationId: string | null,
  options: UseSSEChannelOptions = {},
): UseSSEChannelReturn {
  const { subscribe } = useSSE();
  const { onEvent, onComplete, onError, autoConnect = true } = options;

  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<SSEEvent | null>(null);
  const [status, setStatus] = useState<SSEConnectionStatus>({
    connected: false,
    retryCount: 0,
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const operationIdRef = useRef<string | null>(operationId);
  const latestEventRef = useRef<SSEEvent | null>(null);

  // Use refs for callbacks to avoid recreating them on every render
  const onEventRef = useRef(onEvent);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onEventRef.current = onEvent;
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onEvent, onComplete, onError]);

  const clearSubscription = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  const refreshNotificationsSafely = useCallback(() => {
    // Fetch notifications from API
    void fetchNotifications()
      .then((incoming) => {
        useNotificationStore.getState().mergeNotifications(incoming);
      })
      .catch((error) => {
        // The original snippet had `userNotificationsLogger` and `userId` which are not defined in this context.
        // Reverting to `sseChannelLogger` and `operationIdRef.current` for correctness within `useSSEChannel`.
        sseChannelLogger.error("Failed to refresh notifications", {
          operationId: operationIdRef.current,
          error,
        });
        onErrorRef.current?.("Failed to refresh notifications");
      });
  }, []);

  const handleError = useCallback(
    (errorMessage?: string, code?: string) => {
      if (!errorMessage && !code) {
        return;
      }

      // Don't show error for "Operation already completed" messages
      if (
        code === SSE_ERROR_CODES.OPERATION_COMPLETED ||
        errorMessage?.includes("already completed")
      ) {
        sseChannelLogger.info("Operation already completed", {
          operationId: operationIdRef.current,
        });
        return;
      }

      // Skip connection retry notifications
      if (
        code === SSE_ERROR_CODES.CONNECTION_LOST ||
        errorMessage?.includes("Connection lost, retrying")
      ) {
        sseChannelLogger.debug("Skipping connection retry notification", {
          operationId: operationIdRef.current,
          errorMessage,
        });
        return;
      }

      // Skip "Retrying..." notifications
      if (
        code === SSE_ERROR_CODES.RETRYING ||
        errorMessage?.includes("Retrying...")
      ) {
        sseChannelLogger.debug("Skipping retry notification", {
          operationId: operationIdRef.current,
          errorMessage,
        });
        return;
      }

      // Skip "SSE connection established" notifications
      if (
        code === SSE_ERROR_CODES.CONNECTION_ESTABLISHED ||
        errorMessage?.includes("SSE connection established")
      ) {
        sseChannelLogger.debug("Skipping connection established notification", {
          operationId: operationIdRef.current,
          errorMessage,
        });
        return;
      }

      refreshNotificationsSafely();
      sseChannelLogger.error("SSE channel error", {
        errorMessage,
        operationId: operationIdRef.current,
        code,
      });
      if (errorMessage) {
        onErrorRef.current?.(errorMessage);
      }
    },
    [refreshNotificationsSafely],
  );

  const handleEvent = useCallback(
    (event: SSEEvent) => {
      sseChannelLogger.debug("Received event", {
        operationId: operationIdRef.current,
        step: event.step,
        status: event.status,
        progress: event.progress,
      });
      latestEventRef.current = event;
      setEvents((prev) => {
        const updated = [...prev, event];
        sseChannelLogger.debug("Events array updated", {
          operationId: operationIdRef.current,
          totalEvents: updated.length,
        });
        return updated;
      });
      setLatestEvent(event);
      onEventRef.current?.(event);

      if (COMPLETION_STEPS.has(event.step)) {
        refreshNotificationsSafely();
        onCompleteRef.current?.(event.payload);
      }

      if (
        FAILURE_STEPS.has(event.step) ||
        event.status === "failed" ||
        event.step.endsWith(".failed")
      ) {
        const message =
          typeof event.payload?.error === "string"
            ? event.payload.error
            : event.message;
        handleError(message);
      }
    },
    [handleError, refreshNotificationsSafely],
  );

  const handleStatus = useCallback(
    (newStatus: SSEConnectionStatus) => {
      sseChannelLogger.debug("Connection status update", {
        operationId: operationIdRef.current,
        status: newStatus,
      });
      setStatus(newStatus);

      if (newStatus.error || newStatus.code) {
        handleError(newStatus.error, newStatus.code);
      }
    },
    [handleError],
  );

  const connect = useCallback(() => {
    if (!operationId) {
      sseChannelLogger.warn("Attempted to connect without an operation ID");
      return;
    }

    if (unsubscribeRef.current) {
      sseChannelLogger.info(
        "Existing subscription found, clearing before reconnect",
      );
      clearSubscription();
    }

    sseChannelLogger.info("Connecting to SSE channel", { operationId });

    unsubscribeRef.current = subscribe(operationId, handleEvent, handleStatus);
    operationIdRef.current = operationId;
  }, [clearSubscription, handleEvent, handleStatus, operationId, subscribe]);

  const disconnect = useCallback(() => {
    if (!unsubscribeRef.current) {
      return;
    }
    sseChannelLogger.info("Disconnecting from SSE channel", { operationId });
    clearSubscription();
    setStatus((prev) => ({
      ...prev,
      connected: false,
    }));
  }, [clearSubscription, operationId]);

  // Reset local state when operation ID changes
  useEffect(() => {
    if (operationIdRef.current !== operationId) {
      sseChannelLogger.debug("Operation ID changed, resetting state", {
        previous: operationIdRef.current,
        next: operationId,
      });
      setEvents([]);
      setLatestEvent(null);
      latestEventRef.current = null;
      setStatus({
        connected: false,
        retryCount: 0,
      });
    }
  }, [operationId]);

  // Auto-connect when operation ID becomes available
  useEffect(() => {
    if (!autoConnect || !operationId || !subscribe) {
      return;
    }

    // Don't reconnect if already subscribed to the same operation
    if (operationIdRef.current === operationId && unsubscribeRef.current) {
      sseChannelLogger.debug(
        "Already connected to this operation, skipping reconnect",
      );
      return;
    }

    sseChannelLogger.info("Auto-connecting to SSE channel", { operationId });

    // Clear any existing subscription BEFORE creating a new one
    if (unsubscribeRef.current) {
      sseChannelLogger.info(
        "Cleaning up existing subscription before creating new one",
        {
          previousOperationId: operationIdRef.current,
          newOperationId: operationId,
        },
      );
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Small delay to prevent race conditions during rapid re-renders
    const timeoutId = setTimeout(() => {
      // Check if still the same operation ID and no subscription exists
      if (operationId && !unsubscribeRef.current) {
        sseChannelLogger.info("Creating SSE subscription", { operationId });
        unsubscribeRef.current = subscribe(
          operationId,
          handleEvent,
          handleStatus,
        );
        operationIdRef.current = operationId;
      }
    }, 100); // Small delay to prevent race conditions

    // Cleanup on unmount or when dependencies change
    return () => {
      clearTimeout(timeoutId);
      sseChannelLogger.info("Cleaning up SSE connection", { operationId });
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setStatus((prev) => ({
        ...prev,
        connected: false,
      }));
    };
  }, [autoConnect, handleEvent, handleStatus, operationId, subscribe]);

  const result = useMemo<UseSSEChannelReturn>(
    () => ({
      events,
      latestEvent,
      status,
      connect,
      disconnect,
      isConnected: status.connected,
    }),
    [connect, disconnect, events, latestEvent, status],
  );

  return result;
}
