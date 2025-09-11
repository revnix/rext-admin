import { QueryClient } from "@tanstack/react-query";

/**
 * Create a new QueryClient instance with optimized defaults for Next.js 15
 *
 * Configuration follows Next.js App Router best practices:
 * - Longer stale times for better UX
 * - Retry configuration for network resilience
 * - Background refetch optimization
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Don't refetch immediately on mount if data exists and is less than 5 minutes old
        staleTime: 5 * 60 * 1000, // 5 minutes

        // Keep data in cache for 10 minutes after component unmounts
        gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)

        // Retry failed requests 3 times with exponential backoff
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          if (error instanceof Error && "status" in error) {
            const status = (error as Error & { status: number }).status;
            if (status >= 400 && status < 500) return false;
          }
          return failureCount < 3;
        },

        // Don't refetch on window focus in development (annoying during dev)
        refetchOnWindowFocus: process.env.NODE_ENV === "production",

        // Refetch on reconnect to ensure data freshness
        refetchOnReconnect: true,

        // Don't refetch on mount if we have data (improves perceived performance)
        refetchOnMount: false,
      },
      mutations: {
        // Retry failed mutations once
        retry: 1,
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
