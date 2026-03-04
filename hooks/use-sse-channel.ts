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
import { NOTIFICATION_CONSTANTS } from "@/constants/notifications";

const sseChannelLogger = log.forComponent("useSSEChannel");

async function refreshNotificationsWithState(): Promise<void> {
  const store = useNotificationStore.getState();
  store.setFetchState({ isLoading: true, fetchError: null });

  try {
    const notifications = await fetchNotifications();
    store.mergeNotifications(notifications);
    store.setFetchState({ isLoading: false, fetchError: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    store.setFetchState({ isLoading: false, fetchError: message });
  }
}

/**
 * Classification for SSE status/error messages
 */
type SSEErrorKind = "non_actionable" | "retrying" | "actionable";

/**
 * Classifies SSE error codes and messages to determine handling behavior.
 * Uses explicit code and exact message matching to prevent false negatives.
 *
 * @param errorCode - The SSE error code from the status object
 * @param errorMessage - The error message text
 * @returns Classification indicating how to handle the error
 */
function classifySSEError(
  errorCode?: string,
  errorMessage?: string,
): SSEErrorKind {
  // Non-actionable: Operation completed normally
  if (errorCode === SSE_ERROR_CODES.OPERATION_COMPLETED) {
    return "non_actionable";
  }
  if (errorMessage === "Operation already completed") {
    return "non_actionable";
  }

  // Retrying: Connection transient issues that don't require user action
  if (errorCode === SSE_ERROR_CODES.CONNECTION_LOST) {
    return "retrying";
  }
  if (errorCode === SSE_ERROR_CODES.RETRYING) {
    return "retrying";
  }
  if (
    errorMessage === "Connection lost, retrying..." ||
    errorMessage?.startsWith("Retrying connection")
  ) {
    return "retrying";
  }

  // All other codes and messages are actionable errors
  return "actionable";
}

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

  // const refreshNotificationsSafely = useCallback(() => {
  //   // Fetch notifications from API
  //   void fetchNotifications()
  //     .then((incoming) => {
  //       useNotificationStore.getState().mergeNotifications(incoming);
  //     })
  //     .catch((error) => {
  //       // The original snippet had `userNotificationsLogger` and `userId` which are not defined in this context.
  //       // Reverting to `sseChannelLogger` and `operationIdRef.current` for correctness within `useSSEChannel`.
  //       sseChannelLogger.error("Failed to refresh notifications", {
  //         operationId: operationIdRef.current,
  //         error,
  //       });
  //       onErrorRef.current?.("Failed to refresh notifications");
  //     });
  // }, []);

  void refreshNotificationsWithState();

  const handleError = useCallback((errorMessage?: string, code?: string) => {
    if (!errorMessage && !code) {
      return;
    }

    const kind = classifySSEError(code, errorMessage);

    // Non-actionable statuses are logged and suppressed
    if (kind === "non_actionable") {
      sseChannelLogger.info("Ignoring non-actionable SSE status", {
        operationId: operationIdRef.current,
        code,
        errorMessage,
      });
      return;
    }

    // Retry statuses are suppressed but logged as debug
    if (kind === "retrying") {
      sseChannelLogger.debug("Suppressing retry-status message", {
        operationId: operationIdRef.current,
        code,
        errorMessage,
      });
      return;
    }

    // Actionable errors trigger notification refresh and callback
    void fetchNotifications()
      .then((incoming) => {
        useNotificationStore.getState().mergeNotifications(incoming);
      })
      .catch((error) => {
        sseChannelLogger.error(
          "Failed to refresh notifications after SSE error",
          {
            operationId: operationIdRef.current,
            error,
          },
        );
      });

    sseChannelLogger.error("SSE channel error", {
      operationId: operationIdRef.current,
      code,
      errorMessage,
    });

    if (errorMessage) {
      onErrorRef.current?.(errorMessage);
    }
  }, []);

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
        // Temporarily disabled to prevent excessive API calls.
        // Will revisit after implementing proper throttling/debouncing.
        // refreshNotificationsSafely();
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
    [handleError],
  );

  const handleStatus = useCallback(
    (newStatus: SSEConnectionStatus) => {
      sseChannelLogger.debug("Connection status update", {
        operationId: operationIdRef.current,
        status: newStatus,
      });
      setStatus(newStatus);

      // Only route actual errors/non-actionable status through error handler.
      // Success states (CONNECTION_ESTABLISHED) are not routed to error handler.
      if (
        newStatus.error ||
        (newStatus.code &&
          newStatus.code !== SSE_ERROR_CODES.CONNECTION_ESTABLISHED)
      ) {
        handleError(newStatus.error, newStatus.code);
      } else if (newStatus.code === SSE_ERROR_CODES.CONNECTION_ESTABLISHED) {
        // Log successful connection without treating it as an error
        sseChannelLogger.debug("SSE connection established", {
          operationId: operationIdRef.current,
        });
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
    }, NOTIFICATION_CONSTANTS.SSE_SUBSCRIBE_DELAY_MS); // Small delay to prevent race conditions

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
