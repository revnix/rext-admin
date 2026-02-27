"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";

interface NotificationPreferencesLoadErrorProps {
    message: string;
}

/**
 * Standardized error display for notification preferences loading failures
 *
 * Provides consistent error UX across all notification preference surfaces
 * by using a unified Alert component with destructive styling.
 */
export function NotificationPreferencesLoadError({
    message,
}: NotificationPreferencesLoadErrorProps) {
    return (
        <Alert variant="destructive">
            <AlertDescription>{message}</AlertDescription>
        </Alert>
    );
}
