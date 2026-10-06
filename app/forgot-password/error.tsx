"use client";

import { RouteError } from "@/components/ui/route-error";

/**
 * Forgot Password Page Error Boundary
 *
 * Catches and displays errors that occur during password reset request page rendering.
 * Uses the centralized RouteError component for consistent error UX.
 */
export default function ForgotPasswordError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Password reset error"
      description="We encountered an error loading the password reset page. Please try again or return to login."
      logContext="ForgotPasswordError"
      navigationType="link"
      navigationLink="/login"
      navigationLabel="Back to login"
      layout="fullscreen"
    />
  );
}
