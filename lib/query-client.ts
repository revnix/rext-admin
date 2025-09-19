import { QueryClient } from "@tanstack/react-query";
import { logger } from "@/lib/logger";

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
        // Optimized for 2025 collaborative scenarios
        staleTime: 2 * 60 * 1000, // 2 minutes (reduced from 5 for better collaboration)
        gcTime: 5 * 60 * 1000, // 5 minutes (reduced from 10 for memory efficiency)

        // Better for collaborative scenarios - always fetch fresh data on mount
        refetchOnMount: true, // Changed from false - important for collaboration
        refetchOnWindowFocus: true, // Always enabled for better UX
        refetchOnReconnect: true,

        // Enhanced retry strategy following 2025 best practices
        retry: (failureCount, error) => {
          // Don't retry on client errors (4xx)
          if (error instanceof Error && "status" in error) {
            const status = (error as Error & { status: number }).status;
            if (status >= 400 && status < 500) {
              logger.debug("Not retrying client error", {
                status,
                failureCount,
                component: "QueryClient",
              });
              return false;
            }
          }

          // Don't retry authentication/authorization errors
          if (
            error instanceof Error &&
            error.message.toLowerCase().includes("unauthorized")
          ) {
            logger.warn("Not retrying unauthorized error", {
              error: error.message,
              component: "QueryClient",
            });
            return false;
          }

          // Don't retry more than 2 times (reduced from 3 for faster failure)
          const shouldRetry = failureCount < 2;
          if (!shouldRetry) {
            logger.error("Max retries reached", {
              failureCount,
              error: error.message,
              component: "QueryClient",
            });
          }
          return shouldRetry;
        },

        // Retry delay with exponential backoff (max 30s as per 2025 best practices)
        retryDelay: (attemptIndex) => {
          const delay = Math.min(1000 * 2 ** attemptIndex, 30000);
          logger.debug("Query retry delay", {
            attemptIndex,
            delay,
            component: "QueryClient",
          });
          return delay;
        },

        // Network failure detection
        networkMode: "online",
      },
      mutations: {
        // Enhanced mutation retry strategy
        retry: (failureCount, error) => {
          // Never retry mutations on client errors
          if (error instanceof Error && "status" in error) {
            const status = (error as Error & { status: number }).status;
            if (status >= 400 && status < 500) {
              logger.debug("Not retrying mutation client error", {
                status,
                failureCount,
                component: "QueryClient",
              });
              return false;
            }
          }

          // Only retry once for mutations (reduced from original)
          const shouldRetry = failureCount < 1;
          if (!shouldRetry) {
            logger.warn("Mutation retry limit reached", {
              failureCount,
              error: error.message,
              component: "QueryClient",
            });
          }
          return shouldRetry;
        },

        // Faster retry for mutations
        retryDelay: (attemptIndex) => {
          const delay = Math.min(500 * 2 ** attemptIndex, 5000); // Shorter delays for mutations
          logger.debug("Mutation retry delay", {
            attemptIndex,
            delay,
            component: "QueryClient",
          });
          return delay;
        },

        // Network failure detection for mutations
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
