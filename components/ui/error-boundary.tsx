"use client";

import { AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { log } from "@/lib/logger";
import { generateRequestId } from "@/lib/response-utils";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  requestId: string | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: (string | number)[];
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorId: string;
  requestId?: string;
}

/**
 * Hook-based wrapper component for router access in class component
 */
function ErrorFallbackWithRouter(props: ErrorFallbackProps) {
  const router = useRouter();

  const handleReloadPage = () => {
    router.refresh();
  };

  return <DefaultErrorFallback {...props} onReloadPage={handleReloadPage} />;
}

/**
 * Hook-based wrapper for API Error Boundary
 */
function APIErrorFallbackWithRouter({
  error: _error,
  resetError,
  errorId,
  requestId,
  onRetry,
}: ErrorFallbackProps & { onRetry?: () => void }) {
  const router = useRouter();

  const handleReloadPage = () => {
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
      <AlertTriangle className="h-12 w-12 text-red-500" />
      <div>
        <h3 className="font-semibold text-lg mb-2">Unable to load content</h3>
        <p className="text-sm text-muted-foreground">
          There was an error loading this section. Please try again.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            resetError();
            onRetry?.();
          }}
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Button onClick={handleReloadPage} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reload Page
        </Button>
      </div>
      {process.env.NODE_ENV === "development" && (
        <div className="text-xs text-gray-400 space-y-1">
          <p>Error ID: {errorId}</p>
          {requestId && <p>Request ID: {requestId}</p>}
        </div>
      )}
    </div>
  );
}

/**
 * Default error fallback component
 */
export function DefaultErrorFallback({
  error,
  resetError,
  errorId,
  requestId,
  onReloadPage,
}: ErrorFallbackProps & { onReloadPage?: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          Something went wrong
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-red-600">
          An unexpected error occurred while rendering this component.
        </p>

        {process.env.NODE_ENV === "development" && (
          <details className="text-xs text-gray-600 bg-gray-100 p-3 rounded">
            <summary className="cursor-pointer font-medium mb-2">
              Technical Details (Development Only)
            </summary>
            <pre className="whitespace-pre-wrap">{error.message}</pre>
            {error.stack && (
              <pre className="mt-2 text-xs overflow-auto">{error.stack}</pre>
            )}
          </details>
        )}

        <div className="flex gap-3">
          <Button onClick={resetError} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={onReloadPage} variant="secondary" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reload Page
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>Error ID: {errorId}</p>
          {requestId && <p>Request ID: {requestId}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * React Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree and
 * displays a fallback UI with recovery options.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      requestId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Generate request ID for consistent correlation
    const requestId = generateRequestId("error_boundary");

    return {
      hasError: true,
      error,
      errorId,
      requestId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging without sensitive data
    const errorId = this.state.errorId || "unknown";
    const requestId = this.state.requestId || "unknown";

    log.error("ErrorBoundary caught an error:", {
      errorId,
      requestId,
      message: error.message,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      severity: "critical", // Error boundaries catch critical errors
    });

    // Call optional error reporting callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send error to error tracking service
    // Example: sendErrorToService({ error, errorInfo, errorId });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when resetKeys change
    if (
      hasError &&
      resetKeys &&
      prevProps.resetKeys &&
      resetKeys.some((key, idx) => key !== prevProps.resetKeys?.[idx])
    ) {
      this.resetError();
    }

    // Reset error boundary when any props change (if enabled)
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetError();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      requestId: null,
    });
  };

  render() {
    const { hasError, error, errorId, requestId } = this.state;
    const { children, fallback: FallbackComponent } = this.props;

    if (hasError && error && errorId) {
      const FallbackComponentToRender =
        FallbackComponent || ErrorFallbackWithRouter;

      return (
        <FallbackComponentToRender
          error={error}
          resetError={this.resetError}
          errorId={errorId}
          requestId={requestId || undefined}
        />
      );
    }

    return children;
  }
}

/**
 * Hook-based wrapper for functional components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Simple error boundary for API-dependent sections
 */
export function APIErrorBoundary({
  children,
  onRetry,
}: {
  children: React.ReactNode;
  onRetry?: () => void;
}) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ReactErrorBoundary
          onReset={() => {
            reset();
            onRetry?.();
          }}
          fallbackRender={({ error, resetErrorBoundary }) => {
            const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const requestId = generateRequestId("error_boundary");
            const normalizedError =
              error instanceof Error ? error : new Error(String(error));
            return (
              <APIErrorFallbackWithRouter
                error={normalizedError}
                resetError={resetErrorBoundary}
                errorId={errorId}
                requestId={requestId}
                onRetry={onRetry}
              />
            );
          }}
        >
          {children}
        </ReactErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
