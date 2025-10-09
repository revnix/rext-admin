"use client";

import { fetchEventSource } from "@microsoft/fetch-event-source";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { getAuthHeaders } from "@/lib/auth-utils";
import { log } from "@/lib/logger";
import type { SSEConnectionStatus, SSEEvent } from "@/types/sse";

interface SSEContextType {
  subscribe: (
    operationId: string,
    onEvent: (event: SSEEvent) => void,
    onStatus?: (status: SSEConnectionStatus) => void,
  ) => () => void;
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

function resolveBaseUrl(explicitBaseUrl?: string): string {
  if (explicitBaseUrl && explicitBaseUrl.trim().length > 0) {
    return explicitBaseUrl.replace(/\/+$/, "");
  }

  // Check environment variables FIRST (before window.location)
  const envBaseUrl =
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (envBaseUrl && envBaseUrl.trim().length > 0) {
    return envBaseUrl.replace(/\/+$/, "");
  }

  // Fall back to window.location.origin only if no env var is set
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return "";
}

export function SSEProvider({ children, baseUrl }: SSEProviderProps) {
  const resolvedBaseUrl = useMemo(() => resolveBaseUrl(baseUrl), [baseUrl]);

  const subscribe = useCallback<SSEContextType["subscribe"]>(
    (operationId, onEvent, onStatus) => {
      if (!operationId) {
        sseLogger.warn("Attempted to subscribe without an operation ID");
        return () => undefined;
      }

      let isActive = true;
      let retryCount = 0;
      let abortController = new AbortController();

      const baseEndpoint = resolvedBaseUrl || resolveBaseUrl();

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
            const headers: HeadersInit = {
              Accept: "text/event-stream",
              ...authHeaders,
            };

            const url = buildUrl();

            sseLogger.info("Opening SSE connection", {
              operationId,
              url,
              retryCount,
            });

            await fetchEventSource(url, {
              signal: controller.signal,
              headers,
              openWhenHidden: true,
              onopen: async (response) => {
                if (response.ok) {
                  sseLogger.info("SSE connection opened successfully", {
                    operationId,
                  });
                  retryCount = 0;
                  notifyStatus({
                    connected: true,
                    retryCount: 0,
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
                  sseLogger.error("Client error, stopping reconnection", {
                    operationId,
                    status,
                  });
                  stop({
                    connected: false,
                    retryCount,
                    error: errorMessage,
                  });
                  throw new Error(errorMessage);
                }

                throw new Error(errorMessage);
              },
              onmessage: (message) => {
                if (!message.data) {
                  return;
                }

                try {
                  const event: SSEEvent = JSON.parse(message.data);

                  onEvent(event);

                  const terminalStep =
                    TERMINAL_STEPS.has(event.step) ||
                    event.step.endsWith(".failed");

                  if (terminalStep || event.status === "failed") {
                    const errorMessage =
                      typeof event.payload?.error === "string"
                        ? event.payload.error
                        : event.status === "failed"
                          ? event.message
                          : undefined;

                    stop({
                      connected: false,
                      retryCount,
                      error: errorMessage,
                    });
                  }
                } catch (error) {
                  sseLogger.error("Failed to parse SSE event", error, {
                    operationId,
                    raw: message.data,
                  });
                }
              },
              onclose: () => {
                if (isActive && !controller.signal.aborted) {
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

      return () => {
        sseLogger.info("Unsubscribing from SSE operation", { operationId });
        stop();
      };
    },
    [resolvedBaseUrl],
  );

  const contextValue = useMemo<SSEContextType>(
    () => ({
      subscribe,
    }),
    [subscribe],
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
