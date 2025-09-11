"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
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
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
