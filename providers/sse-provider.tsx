"use client";

import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { ApiError } from "@/lib/api-client/core";
import { getAuthHeaders } from "@/lib/auth-utils";
import { log } from "@/lib/logger";
import {
  type SSEConnectionStatus,
  type SSEEvent,
  SSE_ERROR_CODES,
} from "@/types/sse";
import { SSEEventSchema } from "@/schemas/sse-schemas";

function hasAuthorizationHeader(headers: Record<string, string>): boolean {
  return Object.entries(headers).some(
    ([key, value]) =>
      key.toLowerCase() === "authorization" && value.trim().length > 0,
  );
}

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

const MAX_RETRIES = 5;
const RETRY_BASE_DELAY_MS = 1000;
const RETRY_MAX_DELAY_MS = 10_000;

const TERMINAL_STEPS = new Set(["pipeline.completed", "pipeline.failed"]);

// Track completed operations to prevent reconnection attempts
const completedOperations = new Set<string>();

// Track active subscriptions to prevent multiple connections to same operation
const activeSubscriptions = new Map<
  string,
  {
    abortController: AbortController;
    subscriberCount: number;
    unsubscribe: () => void;
  }
>();

export function SSEProvider({ children, baseUrl }: SSEProviderProps) {
  const resolvedBaseUrl = useMemo(() => resolveApiBaseUrl({
    explicitBaseUrl: baseUrl,
    allowWindowOriginFallback: true,
  }),
    [baseUrl],
  );


  const subscribe = useCallback<SSEContextType["subscribe"]>(
    (operationId, onEvent, onStatus) => {
      if (!operationId) {
        sseLogger.warn("Attempted to subscribe without an operation ID");
        return () => undefined;
      }

      // Check if operation was already completed
      if (completedOperations.has(operationId)) {
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

      // Check if there's already an active subscription for this operation
      const existingSubscription = activeSubscriptions.get(operationId);
      if (existingSubscription) {
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
            activeSubscriptions.delete(operationId);
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
            const authHeaders = await getAuthHeaders();

            if (!hasAuthorizationHeader(authHeaders)) {
              sseLogger.warn("Skipping SSE connection: missing auth token", {
                operationId,
              });

              stop({
                connected: false,
                retryCount,
                error: "Authentication required for live updates",
              });
              return;
            }

            const headers: HeadersInit = {
              Accept: "text/event-stream",
              ...authHeaders,
            };

            await fetchEventSource(buildUrl(), {
              signal: controller.signal,
              headers,
              openWhenHidden: true,
              credentials: "include",
              onopen: async (response) => {
                if (response.status === 401 || response.status === 403) {
                  stop({
                    connected: false,
                    retryCount,
                    error: "Authentication required for live updates",
                  });
                  return;
                }
                if (!response.ok) {
                  throw new Error(`SSE connection failed with status ${response.status}`);
                }

                retryCount = 0;
                notifyStatus({
                  connected: true,
                  retryCount: 0,
                  code: SSE_ERROR_CODES.CONNECTION_ESTABLISHED,
                });
                return;

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
                    completedOperations.add(operationId);
                    stop({
                      connected: false,
                      retryCount,
                      code: SSE_ERROR_CODES.OPERATION_COMPLETED,
                      // Don't show error for completed operations
                    });
                    // Don't throw for 422 - just return to exit the loop gracefully
                    return;
                  }

                  // For other 4xx errors, throw ApiError to be handled in the catch block
                  throw new ApiError(status, errorMessage);
                }

                throw new ApiError(status, errorMessage);
              },
              onmessage: (message) => {
                if (!message.data) {
                  return;
                }

                // Debug: Log the raw message structure
                sseLogger.debug("Raw SSE message", {
                  operationId,
                  hasEvent: "event" in message,
                  hasId: "id" in message,
                  messageKeys: Object.keys(message),
                  dataType: typeof message.data,
                  dataLength: message.data?.length,
                });

                try {
                  const parsed = JSON.parse(message.data);
                  const validationResult = SSEEventSchema.safeParse(parsed);

                  if (!validationResult.success) {
                    sseLogger.warn("SSE event failed schema validation", {
                      operationId,
                      errors: validationResult.error.issues.map(
                        (i) => `${i.path.join(".")}: ${i.message}`,
                      ),
                      dataPreview: message.data?.substring(0, 100),
                    });
                    return; // Skip invalid events rather than passing them to handlers
                  }

                  const event = validationResult.data as SSEEvent;

                  sseLogger.debug("Received SSE event", {
                    operationId,
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
                    completedOperations.add(operationId);

                    const errorMessage =
                      typeof event.payload?.error === "string"
                        ? event.payload.error
                        : event.status === "failed"
                          ? event.message
                          : undefined;

                    // For successful completion, don't pass an error
                    if (event.status === "completed") {
                      stop({
                        connected: false,
                        retryCount,
                        error: undefined,
                      });
                    } else {
                      stop({
                        connected: false,
                        retryCount,
                        error: errorMessage,
                      });
                    }

                    // Return early to prevent the connection from being treated as closed unexpectedly
                    return;
                  }
                } catch (error) {
                  // Log the parse error but don't stop the connection
                  const errorMessage =
                    error instanceof Error ? error.message : String(error);

                  // Try to extract the actual data if it looks like SSE format
                  let actualData = message.data;
                  if (
                    typeof actualData === "string" &&
                    actualData.includes("\ndata: ")
                  ) {
                    const dataMatch = actualData.match(/\ndata: (.+)/);
                    if (dataMatch) {
                      actualData = dataMatch[1];
                      // Try parsing the extracted data with Zod validation
                      try {
                        const parsedFallback = JSON.parse(actualData);
                        const fallbackValidation =
                          SSEEventSchema.safeParse(parsedFallback);

                        if (fallbackValidation.success) {
                          onEvent(fallbackValidation.data as SSEEvent);
                          return;
                        }
                      } catch (_retryError) {
                        // Continue to log the original error
                      }
                    }
                  }

                  sseLogger.error("Failed to parse SSE event", {
                    operationId,
                    error: errorMessage,
                    dataLength: message.data?.length,
                    dataPreview: message.data?.substring(0, 100),
                  });
                  // Don't throw the error - continue processing other events
                }
              },
              onclose: () => {
                if (isActive && !controller.signal.aborted) {
                  // Check if the operation was completed before throwing an error
                  if (completedOperations.has(operationId)) {
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

            if (retryCount >= MAX_RETRIES) {
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
              RETRY_BASE_DELAY_MS * 2 ** (retryCount - 1),
              RETRY_MAX_DELAY_MS,
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
        activeSubscriptions.delete(operationId);
      };

      // Store this subscription in the active subscriptions map
      activeSubscriptions.set(operationId, {
        abortController,
        subscriberCount: 1,
        unsubscribe,
      });

      return unsubscribe;
    },
    [resolvedBaseUrl],
  );

  const clearCompletedOperation = useCallback((operationId: string) => {
    completedOperations.delete(operationId);
    sseLogger.info("Cleared completed operation", { operationId });
  }, []);

  const contextValue = useMemo<SSEContextType>(
    () => ({
      subscribe,
      clearCompletedOperation,
    }),
    [subscribe, clearCompletedOperation],
  );

  return (
    <SSEContext.Provider value={contextValue}>{children}</SSEContext.Provider>
  );
}

export function useSSE(): SSEContextType {
  const context = useContext(SSEContext);

  if (!context) {
    throw new Error("useSSE must be used within an SSEProvider");
  }

  return context;
}
