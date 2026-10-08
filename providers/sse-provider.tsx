"use client";

import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { ApiError } from "@/lib/api-client/core";
import {
  isSignedOut,
  SIGNED_OUT,
  subscribeSignedOut,
} from "@/lib/auth/signed-out";
import { authenticatedFetch } from "@/lib/auth-utils";
import { log } from "@/lib/logger";
import {
  type SSEConnectionStatus,
  type SSEEvent,
  SSE_ERROR_CODES,
} from "@/types/sse";
import { parseOperationEvent } from "@/lib/sse-message";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { NOTIFICATION_CONSTANTS } from "@/constants/notifications";

/** Resolves once the page has a session again, or the stream is given up meanwhile. */
function untilSignedIn(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (!isSignedOut() || signal.aborted) {
      resolve();
      return;
    }
    const done = () => {
      unsubscribe();
      signal.removeEventListener("abort", done);
      resolve();
    };
    const unsubscribe = subscribeSignedOut(() => {
      if (!isSignedOut()) done();
    });
    signal.addEventListener("abort", done, { once: true });
  });
}

type ActiveSubscription = {
  abortController: AbortController;
  subscriberCount: number;
  unsubscribe: () => void;
};

interface SSEContextType {
  subscribe: (
    operationId: string,
    onEvent: (event: SSEEvent) => void,
    onStatus?: (status: SSEConnectionStatus) => void,
  ) => () => void;
  clearCompletedOperation: (operationId: string) => void;
}

const SSEContext = createContext<SSEContextType | null>(null);

interface SSEProviderProps {
  children: ReactNode;
  /**
   * Optional override for the backend API base URL.
   * Falls back to `NEXT_PUBLIC_BACKEND_API_URL`, then `NEXT_PUBLIC_API_BASE_URL`,
   * then the current window origin.
   */
  baseUrl?: string;
}

const sseLogger = log.forComponent("SSEProvider");

const TERMINAL_STEPS = new Set(["pipeline.completed", "pipeline.failed"]);

const MAX_COMPLETED_OPERATIONS = 1000;

/**
 * Provides SSE subscription APIs for long-running operation updates.
 *
 * `baseUrl` optionally overrides environment-derived API resolution.
 */
export function SSEProvider({ children, baseUrl }: SSEProviderProps) {
  const completedOperationsRef = useRef<Set<string>>(new Set());
  const activeSubscriptionsRef = useRef<Map<string, ActiveSubscription>>(
    new Map(),
  );

  const resolvedBaseUrl = useMemo(
    () =>
      resolveApiBaseUrl({
        explicitBaseUrl: baseUrl,
        allowWindowOriginFallback: true,
      }),
    [baseUrl],
  );

  const markOperationCompleted = useCallback((operationId: string): void => {
    completedOperationsRef.current.add(operationId);

    if (completedOperationsRef.current.size > MAX_COMPLETED_OPERATIONS) {
      // Set preserves insertion order — iterator yields oldest first
      const iterator = completedOperationsRef.current.values();
      const excess =
        completedOperationsRef.current.size - MAX_COMPLETED_OPERATIONS;
      for (let i = 0; i < excess; i++) {
        const oldest = iterator.next().value;
        if (oldest !== undefined) {
          completedOperationsRef.current.delete(oldest);
        }
      }
    }
  }, []);

  const subscribe = useCallback<SSEContextType["subscribe"]>(
    (operationId, onEvent, onStatus) => {
      if (!operationId) {
        sseLogger.warn("Attempted to subscribe without an operation ID");
        return () => undefined;
      }

      if (completedOperationsRef.current.has(operationId)) {
        sseLogger.info("Operation already completed, notifying immediately", {
          operationId,
        });

        // Immediately fire the completion event
        // This mimics what would happen if we connected and received the completion event
        const completionEvent: SSEEvent = {
          id: `${operationId}_completed`,
          operation_id: operationId,
          scope: "workspace",
          step: "pipeline.completed",
          status: "completed",
          message: "Operation already completed",
          progress: 100,
          timestamp: new Date().toISOString(),
          payload: undefined, // We don't have the payload since we didn't reconnect
        };

        // Call onEvent with the completion event
        setTimeout(() => {
          onEvent?.(completionEvent);
        }, 0);

        // Notify status
        onStatus?.({
          connected: false,
          retryCount: 0,
          code: SSE_ERROR_CODES.OPERATION_COMPLETED,
        });

        return () => undefined;
      }

      const existingSubscription =
        activeSubscriptionsRef.current.get(operationId);

      if (existingSubscription && existingSubscription.subscriberCount === 0) {
        existingSubscription.unsubscribe();
        activeSubscriptionsRef.current.delete(operationId);

        sseLogger.info("Reusing existing SSE subscription", {
          operationId,
          subscriberCount: existingSubscription.subscriberCount,
        });

        // Increment subscriber count
        existingSubscription.subscriberCount++;

        // Return a function that decrements the count
        return () => {
          existingSubscription.subscriberCount--;
          sseLogger.info("Decremented subscriber count", {
            operationId,
            remainingSubscribers: existingSubscription.subscriberCount,
          });

          // If this was the last subscriber, clean up
          if (existingSubscription.subscriberCount === 0) {
            sseLogger.info("Last subscriber disconnected, cleaning up", {
              operationId,
            });
            existingSubscription.unsubscribe();
            activeSubscriptionsRef.current.delete(operationId);
          }
        };
      }

      let isActive = true;
      let retryCount = 0;
      let abortController = new AbortController();

      const baseEndpoint = resolvedBaseUrl || resolveApiBaseUrl();

      const buildUrl = () =>
        baseEndpoint
          ? `${baseEndpoint}/api/v1/events/${operationId}`
          : `/api/v1/events/${operationId}`;

      const notifyStatus = (status: SSEConnectionStatus) => {
        onStatus?.(status);
      };

      const stop = (status?: SSEConnectionStatus) => {
        if (!isActive) {
          if (status) {
            notifyStatus(status);
          }
          return;
        }

        isActive = false;
        if (!abortController.signal.aborted) {
          abortController.abort();
        }

        notifyStatus(
          status ?? {
            connected: false,
            retryCount,
          },
        );
      };

      const connect = async () => {
        while (isActive) {
          const controller = abortController;

          try {
            // A page with no session has nothing to open a stream with (rext-control tasks 858
            // and 879): it waits here, asking nobody, until the page has a session again.
            if (isSignedOut()) {
              await untilSignedIn(controller.signal);
              if (!isActive || controller.signal.aborted) break;
              retryCount = 0;
            }

            const url = buildUrl();

            await fetchEventSource(url, {
              signal: controller.signal,
              headers: { Accept: "text/event-stream" },
              // The stream opens through the wrapper every request goes through, so it gets what
              // they get: its token (never sent without one), a token past its time renewed
              // first, an "expired" answer renewed and asked again, and a session the backend
              // has ended signed out. Opened with its own headers it asked every five seconds
              // with a token the backend had already refused, for as long as the tab stayed open.
              fetch: (input, init) => authenticatedFetch(String(input), init),
              openWhenHidden: true,
              credentials: "include", // Include cookies for session
              onopen: async (response) => {
                if (response.ok) {
                  retryCount = 0;
                  notifyStatus({
                    connected: true,
                    retryCount: 0,
                    code: SSE_ERROR_CODES.CONNECTION_ESTABLISHED,
                  });
                  return;
                }

                const status = response.status;
                const errorMessage = `SSE connection failed with status ${status}`;
                sseLogger.error("SSE connection failed", {
                  operationId,
                  status,
                });

                if (status >= 400 && status < 500) {
                  // Special handling for 422 - likely means operation is completed
                  if (status === 422) {
                    sseLogger.info("Operation likely completed (422 status)", {
                      operationId,
                    });
                    // Mark as completed to prevent reconnection
                    markOperationCompleted(operationId);
                    stop({
                      connected: false,
                      retryCount,
                      code: SSE_ERROR_CODES.OPERATION_COMPLETED,
                      // Don't show error for completed operations
                    });
                    // Don't throw for 422 - just return to exit the loop gracefully
                    return;
                  }

                  // For other 4xx errors, throw ApiError to be handled in the catch block. A 401
                  // keeps its code: the wrapper's own answer for a page with no session is told
                  // apart from the stream's refusal by it.
                  const code =
                    status === 401
                      ? await response
                          .clone()
                          .json()
                          .then(
                            (body) => body?.error?.code as string | undefined,
                          )
                          .catch(() => undefined)
                      : undefined;
                  throw new ApiError(status, errorMessage, code);
                }

                throw new ApiError(status, errorMessage);
              },
              onmessage: (message) => {
                if (!message.data) {
                  return;
                }

                const parsedMessage = parseOperationEvent(message);
                if ("error" in parsedMessage) {
                  // Skip an event that is not JSON or fails the schema, and keep the
                  // connection open for the next one.
                  sseLogger.warn(
                    "Skipped an SSE event that could not be read",
                    {
                      operationId,
                      eventName: message.event,
                      error: parsedMessage.error,
                      dataLength: message.data.length,
                      dataPreview: message.data.substring(0, 100),
                    },
                  );
                  return;
                }

                const { event } = parsedMessage;

                sseLogger.debug("Received SSE event", {
                  operationId,
                  eventName: message.event,
                  nestedFrame: parsedMessage.nested,
                  event: {
                    step: event.step,
                    status: event.status,
                    progress: event.progress,
                  },
                });

                onEvent(event);

                const terminalStep =
                  TERMINAL_STEPS.has(event.step) ||
                  event.step.endsWith(".failed");

                if (terminalStep || event.status === "failed") {
                  // Mark operation as completed to prevent reconnection
                  markOperationCompleted(operationId);

                  const errorMessage =
                    typeof event.payload?.error === "string"
                      ? event.payload.error
                      : event.status === "failed"
                        ? event.message
                        : undefined;

                  // For successful completion, don't pass an error
                  stop({
                    connected: false,
                    retryCount,
                    error:
                      event.status === "completed" ? undefined : errorMessage,
                  });
                }
              },
              onclose: () => {
                if (isActive && !controller.signal.aborted) {
                  // Check if the operation was completed before throwing an error
                  if (completedOperationsRef.current.has(operationId)) {
                    sseLogger.info("SSE connection closed after completion", {
                      operationId,
                    });
                    return;
                  }
                  throw new Error("SSE connection closed unexpectedly");
                }
              },
              onerror: (error) => {
                if (!isActive) {
                  return;
                }
                throw error;
              },
            });

            // Connection ended gracefully; exit loop.
            break;
          } catch (error) {
            if (!isActive) {
              break;
            }

            if (controller.signal.aborted) {
              break;
            }

            // The page has no session: back to the top of the loop, which waits for one. Nothing
            // is counted against the stream and nobody is asked meanwhile. While a sign-out is
            // still on its way to the sign-in page the state doesn't say so yet, so that case
            // pauses here first.
            if (
              isSignedOut() ||
              (error instanceof ApiError && error.code === SIGNED_OUT)
            ) {
              notifyStatus({ connected: false, retryCount });
              if (!isSignedOut()) {
                await new Promise((resolve) => {
                  setTimeout(
                    resolve,
                    NOTIFICATION_CONSTANTS.SSE_RETRY_MAX_DELAY_MS,
                  );
                });
              }
              continue;
            }

            // A 401 with a session in hand is the stream's own refusal (the wrapper has already
            // renewed an expired token and signed out an ended session): asking again with the
            // same token gets the same answer.
            if (error instanceof ApiError && error.statusCode === 401) {
              sseLogger.error(
                "SSE refused for this session, not asking again",
                {
                  operationId,
                },
              );
              stop({
                connected: false,
                retryCount,
                error: "Connection refused",
              });
              break;
            }

            retryCount += 1;

            const errorMessage =
              error instanceof Error ? error.message : String(error);

            // Check if error is rate limit related (HTTP 429)
            if (
              (error instanceof ApiError && error.statusCode === 429) ||
              errorMessage.toLowerCase().includes("rate limit")
            ) {
              sseLogger.error(
                "Rate limit error detected, stopping reconnection",
                {
                  operationId,
                  error: errorMessage,
                },
              );
              stop({
                connected: false,
                retryCount,
                error: "Rate limit exceeded. Please try again later.",
                code: SSE_ERROR_CODES.RATE_LIMIT_EXCEEDED,
              });
              break;
            }

            sseLogger.warn("SSE connection error", {
              operationId,
              retryCount,
              error: errorMessage,
            });

            // The per-user notification channel lives as long as the page, so
            // it keeps retrying (at the capped delay) through backend restarts
            // instead of going silent until a reload.
            if (
              !operationId.startsWith("user-notifications-") &&
              retryCount >= NOTIFICATION_CONSTANTS.SSE_MAX_RETRIES
            ) {
              stop({
                connected: false,
                retryCount,
                error: "Connection failed after multiple retries",
              });
              break;
            }

            notifyStatus({
              connected: false,
              retryCount,
              error: "Connection lost, retrying...",
              code: SSE_ERROR_CODES.CONNECTION_LOST,
            });

            const delay = Math.min(
              NOTIFICATION_CONSTANTS.SSE_RETRY_BASE_DELAY_MS *
                2 ** (retryCount - 1),
              NOTIFICATION_CONSTANTS.SSE_RETRY_MAX_DELAY_MS,
            );

            await new Promise((resolve) => {
              setTimeout(resolve, delay);
            });

            if (!isActive) {
              break;
            }

            abortController = new AbortController();
          }
        }
      };

      void connect();

      // Create the unsubscribe function
      const unsubscribe = () => {
        sseLogger.info("Unsubscribing from SSE operation", { operationId });
        stop();
        // Remove from active subscriptions map
        activeSubscriptionsRef.current.delete(operationId);
      };

      activeSubscriptionsRef.current.set(operationId, {
        abortController,
        subscriberCount: 1,
        unsubscribe,
      });

      return unsubscribe;
    },
    [resolvedBaseUrl, markOperationCompleted],
  );

  const clearCompletedOperation = useCallback((operationId: string) => {
    completedOperationsRef.current.delete(operationId);
    sseLogger.info("Cleared completed operation", { operationId });
  }, []);

  const contextValue = useMemo<SSEContextType>(
    () => ({
      subscribe,
      clearCompletedOperation,
    }),
    [subscribe, clearCompletedOperation],
  );

  useEffect(() => {
    return () => {
      for (const subscription of activeSubscriptionsRef.current.values()) {
        if (!subscription.abortController.signal.aborted) {
          subscription.abortController.abort();
        }
        subscription.unsubscribe();
      }

      activeSubscriptionsRef.current.clear();
      completedOperationsRef.current.clear();
    };
  }, []);

  return (
    <SSEContext.Provider value={contextValue}>{children}</SSEContext.Provider>
  );
}

/**
 * Access the active SSE context.
 *
 * @throws Error when used outside `SSEProvider`
 */
export function useSSE(): SSEContextType {
  const context = useContext(SSEContext);

  if (!context) {
    throw new Error("useSSE must be used within an SSEProvider");
  }

  return context;
}
