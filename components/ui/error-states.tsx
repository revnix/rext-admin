"use client";

import { AlertTriangle } from "lucide-react";
import { Component, type ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Inline error alert for form/API errors
 *
 * @example
 * ```tsx
 * {error && (
 *   <ErrorAlert
 *     title="Failed to save"
 *     message={error.message}
 *     retry={handleRetry}
 *   />
 * )}
 * ```
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
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{message}</p>
        {retry && (
          <Button variant="outline" size="sm" onClick={retry} className="mt-2">
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Full page error state
 *
 * @example
 * ```tsx
 * if (error) {
 *   return (
 *     <ErrorPage
 *       title="Failed to load data"
 *       message={error.message}
 *       retry={refetch}
 *     />
 *   );
 * }
 * ```
 */
export function ErrorPage({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  retry,
  goBack,
}: {
  title?: string;
  message?: string;
  retry?: () => void;
  goBack?: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="flex gap-2">
            {retry && (
              <Button onClick={retry} size="sm">
                Try Again
              </Button>
            )}
            {goBack && (
              <Button onClick={goBack} variant="outline" size="sm">
                Go Back
              </Button>
            )}
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
