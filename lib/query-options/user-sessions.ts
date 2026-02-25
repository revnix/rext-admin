import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export const userSessionsQueryOptions = (refetchInterval?: number) =>
  queryOptions({
    queryKey: ["user-sessions"],
    queryFn: () => apiClient.sessions.list(),
    ...(refetchInterval ? { refetchInterval } : {}),
  });
