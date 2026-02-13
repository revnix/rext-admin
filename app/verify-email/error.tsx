"use client";

import { RouteError } from "@/components/ui/route-error";

/**
 * Verify Email Page Error Boundary
 * 
 * Catches and displays errors that occur during email verification page rendering.
 * Uses the centralized RouteError component for consistent error UX.
 */
export default function VerifyEmailError(props: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <RouteError
            {...props}
            title="Email Verification Error"
            description="We encountered an error during email verification. Please try again or contact support if the problem persists."
            logContext="VerifyEmailError"
            navigationType="link"
            navigationLink="/login"
            navigationLabel="Go to Login"
            layout="fullscreen"
        />
    );
}