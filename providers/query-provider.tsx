"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { SignedOutNotice } from "@/components/auth/signed-out-notice";
import { ServerAwayNotice } from "@/components/server-away-notice";
import { getQueryClient } from "@/lib/query-client";

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * TanStack Query Provider for Next.js 15 App Router
 *
 * This provider ensures proper hydration and client-side query management.
 * It follows the recommended pattern for App Router with React 19.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Create query client on first render to avoid hydration mismatches
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Says so while the API is away (a deploy's restart), and reloads what failed once it's back. */}
      <ServerAwayNotice />
      {/* Says so when the page is still open and its session has ended, with the way back in. */}
      <SignedOutNotice />
      {/* Only include devtools in development builds */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
