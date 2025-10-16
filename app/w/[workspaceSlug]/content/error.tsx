"use client";

import { RouteError } from "@/components/ui/route-error";

/**
 * Content Error Boundary
 */
export default function ContentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Content Error"
      logContext="ContentError"
      layout="container"
      navigationType="back"
    />
  );
}
