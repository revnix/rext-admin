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
      title="Admin panel error"
      logContext="AdminError"
      navigationType="link"
      navigationLink="/"
      navigationLabel="Dashboard"
      layout="container"
    />
  );
}
