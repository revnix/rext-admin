"use client";

import { AlertTriangle } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class TopicBuilderErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { componentName = "TopicBuilder" } = this.props;

    console.error(
      `[${componentName}] Error boundary caught an error:`,
      error,
      errorInfo,
    );

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === "production") {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-background border border-destructive/20 rounded-lg">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-destructive">
              Something went wrong
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {this.props.componentName} encountered an error. Please try
              refreshing the page.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="text-xs text-left bg-muted p-2 rounded mt-4">
                <summary className="cursor-pointer font-medium">
                  Error Details
                </summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            Refresh Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
