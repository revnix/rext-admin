"use client";

import { RouteError } from "@/components/ui/route-error";

/**
 * Reset Password Page Error Boundary
 *
 * Catches and displays errors that occur during password reset confirmation page rendering.
 * Uses the centralized RouteError component for consistent error UX.
 */
export default function ResetPasswordError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Password Reset Error"
      description="We encountered an error loading the password reset page. Please request a new reset link or return to login."
      logContext="ResetPasswordError"
      navigationType="link"
      navigationLink="/forgot-password"
      navigationLabel="Request New Link"
      layout="fullscreen"
    />
  );
}
