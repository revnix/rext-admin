"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";

import { impersonationQueries } from "@/lib/query-keys";
import { openSupportChat, supportChatEnabled } from "@/lib/support-chat/chat";

/**
 * Whether "Chat with us" is offered, and what it does (revnix/rext-control#711). Never while
 * an admin is viewing as someone else: the admin would chat as the customer (the identity
 * route refuses it too). The impersonation status is the banner's own query, read from its
 * cache.
 */
export function useSupportChat() {
  const enabled = supportChatEnabled();
  const { data: impersonation } = useQuery({
    ...impersonationQueries.status(),
    enabled,
    staleTime: 20_000,
    retry: false,
    throwOnError: false,
  });

  const open = useCallback(async () => {
    if (await openSupportChat()) return;
    toast.error("The chat couldn't open", {
      description: "Try again in a moment, or use the help center.",
    });
  }, []);

  // Only once the status says no: unknown (still loading, or failed) offers nothing.
  return {
    available: enabled && impersonation?.is_impersonating === false,
    open,
  };
}
