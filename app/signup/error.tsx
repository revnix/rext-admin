"use client";

import { RouteError } from "@/components/ui/route-error";

/**
 * Signup Page Error Boundary
 *
 * Catches and displays errors that occur during signup page rendering.
 * Uses the centralized RouteError component for consistent error UX.
 */
export default function SignupError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Sign Up Error"
      description="We encountered an error loading the sign up page. Please try again or contact support if the problem persists."
      logContext="SignupError"
      navigationType="link"
      navigationLink="/login"
      navigationLabel="Login Instead"
      layout="fullscreen"
    />
  );
}
