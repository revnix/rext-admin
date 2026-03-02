"use client";

import { RouteError } from "@/components/ui/route-error";

export default function BillingError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Billing Error"
      logContext="BillingError"
      navigationType="link"
      navigationLink="/settings/subscription"
      navigationLabel="Subscription Settings"
    />
  );
}
