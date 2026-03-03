"use client";

import { RouteError } from "@/components/ui/route-error";

export default function CheckoutError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Checkout Error"
      logContext="CheckoutError"
      navigationType="link"
      navigationLink="/pricing"
      navigationLabel="Pricing"
    />
  );
}
