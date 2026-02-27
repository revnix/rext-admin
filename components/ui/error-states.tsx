"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Inline error alert for form/API errors
 */
export function ErrorAlert({
  title = "Error",
  message,
  retry,
}: {
  title?: string;
  message: string;
  retry?: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{message}</p>
        {retry && (
          <Button variant="outline" size="sm" onClick={retry} className="mt-2">
            <RefreshCw className="h-3 w-3 mr-2" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Full page error state
 */
export function ErrorPage({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  retry,
  goBack,
  dashboardLink = "/admin",
  dashboardLabel = "Dashboard",
}: {
  title?: string;
  message?: string;
  retry?: () => void;
  goBack?: () => void;
  dashboardLink?: string;
  dashboardLabel?: string;
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full border-destructive shadow-lg transition-all">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          </div>
          <CardDescription className="text-sm font-medium">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            {retry && (
              <Button onClick={retry} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button asChild variant="secondary" className="flex-1">
              <Link href={dashboardLink}>
                <Home className="h-4 w-4 mr-2" />
                {dashboardLabel}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * React Error Boundary for catching component errors
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error in development
    if (process.env.NODE_ENV === "development") {
      // biome-ignore lint/suspicious/noConsole: Error logging for development debugging
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorPage
          title="Component Error"
          message={
            this.state.error?.message ||
            "An error occurred while rendering this component."
          }
          retry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Inline error message for form fields
 *
 * @example
 * ```tsx
 * <Input {...register('email')} />
 * {errors.email && <FieldError message={errors.email.message} />}
 * ```
 */
export function FieldError({ message }: { message: string }) {
  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

/**
 * Generic error display component
 *
 * @example
 * ```tsx
 * {error && <ErrorDisplay error={error} />}
 * ```
 */
export function ErrorDisplay({
  error,
  onRetry,
}: {
  error: Error | string;
  onRetry?: () => void;
}) {
  const message = typeof error === "string" ? error : error.message;

  return <ErrorAlert title="Error" message={message} retry={onRetry} />;
}
