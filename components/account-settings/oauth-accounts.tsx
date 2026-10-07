"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Notice } from "@/components/ui/notice";
import { markOAuthLinking } from "@/lib/analytics";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import type { OAuthAccount } from "@/lib/api-client/oauth";

const providerDisplayNames: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  microsoft: "Microsoft",
  facebook: "Facebook",
};

const providerIcons: Record<string, string> = {
  google: "https://www.google.com/favicon.ico",
  github: "https://github.com/favicon.ico",
  microsoft: "https://microsoft.com/favicon.ico",
  facebook: "https://facebook.com/favicon.ico",
};

export function OAuthAccounts() {
  const queryClient = useQueryClient();
  const [accountToUnlink, setAccountToUnlink] = useState<OAuthAccount | null>(
    null,
  );

  const {
    data: accounts,
    isLoading,
    error,
  } = useQuery<OAuthAccount[]>({
    queryKey: ["oauth-accounts"],
    queryFn: () => apiClient.oauth.listAccounts(),
  });

  // Unlink mutation
  const unlinkMutation = useMutation({
    mutationFn: (provider: string) => apiClient.oauth.unlinkAccount(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oauth-accounts"] });
      toast.success("Account unlinked successfully");
      setAccountToUnlink(null);
    },
    onError: (error: Error) => {
      toast.error("Failed to unlink account", { description: error.message });
    },
  });

  const handleUnlink = (account: OAuthAccount) => {
    setAccountToUnlink(account);
  };

  const confirmUnlink = () => {
    if (accountToUnlink) {
      unlinkMutation.mutate(accountToUnlink.provider);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Notice tone="danger" title="Connected accounts didn't load">
        Reload the page to try again.
      </Notice>
    );
  }

  const availableProviders = ["google", "github"];
  const connectedProviders = accounts?.map((a) => a.provider) || [];
  const unconnectedProviders = availableProviders.filter(
    (p) => !connectedProviders.includes(p),
  );

  return (
    <div className="space-y-6">
      {/* Connected Accounts */}
      {accounts && accounts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Linked Accounts</h4>
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between rounded-md border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Image
                    src={
                      providerIcons[account.provider] || "/placeholder-icon.png"
                    }
                    alt={account.provider}
                    width={20}
                    height={20}
                    unoptimized
                    className="h-5 w-5"
                  />
                </div>
                <div>
                  <p className="font-medium">
                    {providerDisplayNames[account.provider] || account.provider}
                  </p>
                  {account.provider_email && (
                    <p className="text-sm text-muted-foreground">
                      {account.provider_email}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Connected{" "}
                    {new Date(account.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleUnlink(account)}
                disabled={unlinkMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Unlink
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Available Providers to Link */}
      {unconnectedProviders.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Available Providers</h4>
          <div className="grid gap-3">
            {unconnectedProviders.map((provider) => (
              <div
                key={provider}
                className="flex flex-col sm:flex-row items-center justify-between rounded-md border p-4"
              >
                <div className="flex items-center flex-col sm:flex-row gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Image
                      src={providerIcons[provider] || "/placeholder-icon.png"}
                      alt={provider}
                      width={20}
                      height={20}
                      unoptimized
                      className="h-5 w-5"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-center sm:text-start">
                      {providerDisplayNames[provider] || provider}
                    </p>
                    <p className="text-sm text-center sm:text-start text-muted-foreground">
                      Not connected
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 sm:mt-0 h-8 w-full sm:w-auto"
                  onClick={() => {
                    // The same OAuth sign-in as logging in: marked, so analytics doesn't count it as one.
                    markOAuthLinking();
                    signIn(provider, { callbackUrl: "/settings" });
                  }}
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  Link Account
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {accounts?.length === 0 && (
        <Notice>
          You haven't linked any OAuth accounts yet. Link accounts for easier
          sign-in.
        </Notice>
      )}

      {/* Unlink Confirmation Dialog */}
      <AlertDialog
        open={!!accountToUnlink}
        onOpenChange={(open) => !open && setAccountToUnlink(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink OAuth Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink your{" "}
              {accountToUnlink &&
                providerDisplayNames[accountToUnlink.provider]}{" "}
              account? You can always link it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnlink}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {unlinkMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unlinking...
                </>
              ) : (
                "Unlink Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
