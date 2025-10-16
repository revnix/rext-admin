"use client";

import { RouteError } from "@/components/ui/route-error";

/**
 * Admin Error Boundary
 */
export default function AdminError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Admin Panel Error"
      logContext="AdminError"
      navigationType="link"
      navigationLink="/dashboard"
      navigationLabel="Dashboard"
    />
  );
}
