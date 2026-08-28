import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client/core";

export const userSessionsQueryOptions = (refetchInterval?: number) =>
  queryOptions({
    queryKey: ["user-sessions"],
    queryFn: () => apiClient.sessions.list(),
    // Retry with backoff to survive transient 401s during token refresh.
    // authenticatedFetch detects expired tokens and refreshes in the background,
    // but the initial request may fail before the new token is ready. Retrying
    // with increasing delays gives the refresh time to complete.
    retry: (failureCount, error) => {
      // Don't retry definitive errors that won't recover
      if (ApiError.is(error) && (error.statusCode === 403 || error.statusCode === 404)) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    ...(refetchInterval ? { refetchInterval } : {}),
  });
