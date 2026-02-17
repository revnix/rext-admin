"use client";

import { AlertTriangle } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/api-client/core";

interface PermissionErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface PermissionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Permission Error Boundary
 *
 * Catches permission-related errors and displays a user-friendly message.
 * Only catches errors related to permissions (403, permission denied).
 * Other errors are re-thrown.
 *
 * @example
 * <PermissionErrorBoundary>
 *   <AdminPanel />
 * </PermissionErrorBoundary>
 *
 * @example
 * // With custom fallback
 * <PermissionErrorBoundary
 *   fallback={<CustomPermissionDenied />}
 * >
 *   <SensitiveComponent />
 * </PermissionErrorBoundary>
 */
export class PermissionErrorBoundary extends React.Component<
  PermissionErrorBoundaryProps,
  PermissionErrorBoundaryState
> {
  constructor(props: PermissionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Check if it's a permission error
    const isApiPermissionError =
      error instanceof ApiError &&
      (error.statusCode === 403 || error.statusCode === 401);

    const isPermissionError =
      isApiPermissionError ||
      error.message.toLowerCase().includes("permission") ||
      error.message.includes("403") ||
      error.message.toLowerCase().includes("unauthorized") ||
      error.message.toLowerCase().includes("access denied");

    if (isPermissionError) {
      return { hasError: true, error };
    }

    // Re-throw other errors
    throw error;
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // You can log to external error tracking service here
    // e.g., Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default permission denied UI
      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-yellow-500" />
            </div>

            <h2 className="text-xl font-semibold mb-2">Permission Denied</h2>

            <p className="text-muted-foreground mb-4">
              You don't have permission to access this feature. If you believe
              this is an error, please contact your administrator.
            </p>

            {this.state.error && (
              <p className="text-sm text-muted-foreground mb-4 font-mono bg-muted p-2 rounded">
                {this.state.error.message}
              </p>
            )}

            <Button onClick={this.handleReset}>Try Again</Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
