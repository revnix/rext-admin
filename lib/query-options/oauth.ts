import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export const oauthQueryKeys = {
  all: ["oauth"] as const,
  accounts: () => [...oauthQueryKeys.all, "accounts"] as const,
};

export const oauthAccountsQueryOptions = () =>
  queryOptions({
    queryKey: oauthQueryKeys.accounts(),
    queryFn: () => apiClient.oauth.listAccounts(),
    staleTime: 60_000,
  });