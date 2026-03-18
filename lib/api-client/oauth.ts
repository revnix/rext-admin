import type { SuccessResponseUnlinkOAuthResponse } from "@/types/generated/types.gen";
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

export function createOAuthNamespace(client: ApiClient) {
  return {
    listAccounts: async (): Promise<OAuthAccount[]> => {
      const response = await client.request<OAuthAccountsResponse>(
        "/api/v1/user/oauth/accounts",
        { method: "GET" },
      );
      return response.accounts;
    },

    unlinkAccount: async (
      provider: string,
    ): Promise<SuccessResponseUnlinkOAuthResponse> => {
      return client.request<SuccessResponseUnlinkOAuthResponse>(
        `/api/v1/user/oauth/${provider}`,
        {
          method: "DELETE",
        },
      );
    },
  };
}
