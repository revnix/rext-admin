"use client";

import { RouteError } from "@/components/ui/route-error";

/**
 * Login Page Error Boundary
 *
 * Catches and displays errors that occur during login page rendering.
 * Uses the centralized RouteError component for consistent error UX.
 */
export default function LoginError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Login error"
      description="We encountered an error loading the login page. Please try again or contact support if the problem persists."
      logContext="LoginError"
      navigationType="link"
      navigationLink="/signup"
      navigationLabel="Sign up instead"
      layout="fullscreen"
    />
  );
}
