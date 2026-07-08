"use client";

import { RouteError } from "@/components/ui/route-error";

export default function GoogleDashboardError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Google Integration Error"
      logContext="GoogleDashboardError"
      layout="container"
      navigationType="back"
    />
  );
}
