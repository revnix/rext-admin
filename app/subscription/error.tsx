"use client";

import { RouteError } from "@/components/ui/route-error";

export default function SubscriptionError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Subscription error"
      logContext="SubscriptionError"
      navigationType="link"
      navigationLink="/settings/subscription"
      navigationLabel="Subscription settings"
      layout="container"
    />
  );
}
