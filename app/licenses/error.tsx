"use client";

import { RouteError } from "@/components/ui/route-error";

export default function LicensesError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="License Management Error"
      logContext="LicensesError"
      navigationType="link"
      navigationLink="/"
      navigationLabel="Dashboard"
    />
  );
}
