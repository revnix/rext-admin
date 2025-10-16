"use client";

import { RouteError } from "@/components/ui/route-error";

/**
 * Root Error Boundary
 *
 * Catches all unhandled errors at the application root level.
 * Provides user-friendly error message and recovery options.
 */
export default function RootError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Something went wrong"
      logContext="RootError"
      layout="fullscreen"
      navigationType="link"
      navigationLink="/"
      navigationLabel="Go Home"
    />
  );
}
