"use client";

import { RouteError } from "@/components/ui/route-error";

/**
 * Settings Error Boundary
 */
export default function SettingsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Settings Error"
      logContext="SettingsError"
      navigationType="link"
      navigationLink="/"
      navigationLabel="Dashboard"
    />
  );
}
