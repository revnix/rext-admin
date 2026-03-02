import type { ApiClient } from "./core";

export interface OAuthAccount {
  id: string;
  provider: string;
  provider_account_id: string;
  provider_email: string | null;
  created_at: string;
}

interface OAuthAccountsResponse {
  accounts: OAuthAccount[];
}

interface OAuthUnlinkResponse {
  provider: string;
  status: string;
}

export function createOAuthNamespace(client: ApiClient) {
  return {
    listAccounts: async (): Promise<OAuthAccount[]> => {
      const response = await client.request<OAuthAccountsResponse>(
        "/api/v1/user/oauth/accounts",
        { method: "GET" },
      );
      return response.accounts;
    },

    unlinkAccount: async (provider: string): Promise<OAuthUnlinkResponse> => {
      return client.request<OAuthUnlinkResponse>(
        `/api/v1/user/oauth/${provider}`,
        {
          method: "DELETE",
        },
      );
    },
  };
}
