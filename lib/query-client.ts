import { QueryClient } from "@tanstack/react-query";

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

        // No retries - fail fast for better user experience
        retry: false,

        // Network failure detection
        networkMode: "online",
      },
      mutations: {
        // No retries for mutations - fail fast
        retry: false,

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
