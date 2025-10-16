"use client";

import { RouteError } from "@/components/ui/route-error";

/**
 * Dashboard Error Boundary
 */
export default function DashboardError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Dashboard Error"
      logContext="DashboardError"
      navigationType="link"
      navigationLink="/"
      navigationLabel="Home"
    />
  );
}
