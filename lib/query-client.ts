import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client/core";
import { alreadyRetried } from "@/lib/api-client/server-away";
import { redirectToLogin } from "@/lib/auth-utils";

/**
 * Create a new QueryClient instance with smart retry and caching defaults.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes

        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,

        // Conditional retry: skip client errors (4xx), retry server errors and network failures
        retry: (failureCount, error) => {
          if (
            error instanceof ApiError &&
            error.statusCode >= 400 &&
            error.statusCode < 500
          ) {
            return false;
          }
          // The API client already waited out a server that was away (a deploy's restart).
          if (alreadyRetried(error)) return false;
          return failureCount < 2;
        },

        // Global safety net for unhandled auth errors: bounce to login instead of throwing to ErrorBoundary
        throwOnError: (error) => {
          if (error instanceof ApiError && error.statusCode === 401) {
            if (typeof window !== "undefined") {
              redirectToLogin("SessionExpired");
            }
            return false;
          }
          return false;
        },

        // Exponential backoff: 1s, 2s (capped at 3s)
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),

        networkMode: "online",
      },
      mutations: {
        // No retries for mutations — they may not be idempotent
        retry: false,
        networkMode: "online",
      },
    },
  });
}

// Create a singleton instance for client-side use
let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a new query client
    return makeQueryClient();
  } else {
    // Browser: create query client if we don't have one or if it's been disposed
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}
