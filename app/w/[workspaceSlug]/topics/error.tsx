"use client";

import { RouteError } from "@/components/ui/route-error";

/**
 * Topics Error Boundary
 */
export default function TopicsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Topics Error"
      logContext="TopicsError"
      layout="container"
      navigationType="back"
    />
  );
}
