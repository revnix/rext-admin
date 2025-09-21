"use client";

import { AlertTriangle, Home, RefreshCw, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Next.js error boundary for the Topic Builder route
 *
 * Catches and handles errors that occur during rendering or in event handlers
 * within the Topic Builder page and its child components.
 */
export default function TopicBuilderError({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Log error for debugging
    console.error("Topic Builder route error:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    });
  }, [error]);

  const handleReloadPage = () => {
    // Use router refresh instead of window.location.reload
    router.refresh();
  };

  const handleBackToTopics = () => {
    // Use router navigation instead of direct location assignment
    router.push("/topics");
  };

  const breadcrumbs = [
    { label: "Topics", href: "/topics" },
    { label: "Topic Builder" },
  ];

  const isNetworkError =
    error.message.includes("fetch") ||
    error.message.includes("network") ||
    error.message.includes("Failed to fetch");

  const isConfigError =
    error.message.includes("configuration") ||
    error.message.includes("environment");

  return (
    <PageLayout
      title="Topic Builder"
      description="Generate AI-powered content topics"
      breadcrumbs={breadcrumbs}
    >
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-lg w-full border-red-200">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-xl text-red-700">
              Unable to Load Topic Builder
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            <div className="space-y-3">
              {isNetworkError && (
                <p className="text-red-600">
                  There seems to be a network connectivity issue. Please check
                  your internet connection and try again.
                </p>
              )}

              {isConfigError && (
                <p className="text-red-600">
                  There's a configuration issue with the Topic Builder. Please
                  contact support if this problem persists.
                </p>
              )}

              {!isNetworkError && !isConfigError && (
                <p className="text-red-600">
                  An unexpected error occurred while loading the Topic Builder.
                  This might be a temporary issue.
                </p>
              )}

              <p className="text-sm text-muted-foreground">
                Your form data is automatically saved, so you won't lose any
                progress when you try again.
              </p>
            </div>

            {/* Development mode error details */}
            {process.env.NODE_ENV === "development" && (
              <details className="text-left text-xs bg-gray-100 p-4 rounded border">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="space-y-2">
                  <div>
                    <strong>Message:</strong> {error.message}
                  </div>
                  {error.digest && (
                    <div>
                      <strong>Digest:</strong> {error.digest}
                    </div>
                  )}
                  {error.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 p-2 bg-gray-200 rounded text-xs overflow-auto whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Recovery actions */}
            <div className="flex flex-col gap-3">
              <Button onClick={reset} size="lg" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>

              <div className="flex gap-3">
                <Button
                  onClick={handleReloadPage}
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>

                <Button
                  onClick={handleBackToTopics}
                  variant="secondary"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Back to Topics
                </Button>
              </div>
            </div>

            {/* Support information */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>If this problem persists, please contact support.</p>
              {error.digest && (
                <p className="font-mono">Error ID: {error.digest}</p>
              )}
              <p>Timestamp: {new Date().toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
