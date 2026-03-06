"use client";

import { RouteError } from "@/components/ui/route-error";

export default function PricingError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Pricing Error"
      logContext="PricingError"
      navigationType="link"
      navigationLink="/"
      navigationLabel="Dashboard"
    />
  );
}
