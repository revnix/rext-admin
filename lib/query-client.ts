import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client/core";

/**
 * Create a new QueryClient instance optimized for 2025 best practices
 *
 * Configuration balances performance with real-time collaboration needs:
 * - Shorter stale times for collaborative scenarios (2min vs 5min)
 * - Smart refetch defaults for better user experience
 * - Enhanced retry strategies with exponential backoff
 * - Structured logging integration
 * - Optimized for Next.js 15 + Server Components
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

        // Conditional retry: skip client errors (4xx), retry server errors (5xx) and network failures
        retry: (failureCount, error) => {
          // Don't retry client errors — they won't succeed on retry
          if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
            return false;
          }
          // Retry server errors and network failures up to 2 times
          return failureCount < 2;
        },

        // Exponential backoff: 1s, 2s (capped at 3s)
        retryDelay: (attemptIndex) =>
          Math.min(1000 * 2 ** attemptIndex, 3000),

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
