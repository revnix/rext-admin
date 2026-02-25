"use client";

import { AlertCircle, ArrowLeft, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { log } from "@/lib/logger";
import type { Route } from "next";

/**
 * Reusable Route Error Boundary Component
 *
 * A centralized error UI component that can be used across all route segments.
 * Provides consistent error handling with customizable titles, descriptions, and navigation.
 *
 * @example
 * // In app/admin/error.tsx
 * "use client"
 * import { RouteError } from "@/components/ui/route-error"
 *
 * export default function Error(props) {
 *   return (
 *     <RouteError
 *       {...props}
 *       title="Admin Panel Error"
 *       logContext="AdminError"
 *       navigationType="link"
 *       navigationLink="/"
 *       navigationLabel="Dashboard"
 *     />
 *   )
 * }
 */

export interface RouteErrorProps {
  /** The error object from Next.js error boundary */
  error: Error & { digest?: string };
  /** Function to attempt recovery by re-rendering the segment */
  reset: () => void;
  /** Title displayed in the error card */
  title?: string;
  /** Custom description (overrides error.message) */
  description?: string;
  /** Context string for logging (e.g., "AdminError", "DashboardError") */
  logContext?: string;
  /** Type of navigation for the secondary action */
  navigationType?: "link" | "back";
  /** Link href when navigationType is "link" */
  navigationLink?: string;
  /** Label for the navigation button */
  navigationLabel?: string;
  /** Layout variant: "fullscreen" for full-page errors, "container" for in-page errors */
  layout?: "fullscreen" | "container";
  /** Additional CSS classes for the container */
  className?: string;
}

export function RouteError({
  error,
  reset,
  title = "Something went wrong",
  description,
  logContext = "RouteError",
  navigationType = "link",
  navigationLink = "/",
  navigationLabel = "Home",
  layout = "fullscreen",
  className = "",
}: RouteErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Log error with context for debugging and monitoring
    log.error(`[${logContext}]`, error);
  }, [error, logContext]);

  const errorMessage =
    description || error.message || "An unexpected error occurred";

  const containerClasses =
    layout === "fullscreen"
      ? `flex items-center justify-center min-h-screen p-4 ${className}`
      : `container mx-auto p-6 ${className}`;

  const innerWrapperClasses =
    layout === "container"
      ? "flex items-center justify-center min-h-[60vh]"
      : "";

  const cardClasses =
    layout === "fullscreen"
      ? "max-w-md w-full border-destructive"
      : "max-w-md w-full border-destructive";

  const titleClasses = layout === "fullscreen" ? "text-xl" : "";

  const NavigationButton = () => {
    if (navigationType === "back") {
      return (
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      );
    }

    return (
      <Button asChild variant="outline" className="flex-1">
        <Link href={navigationLink as Route}>
          <Home className="h-4 w-4 mr-2" />
          {navigationLabel}
        </Link>
      </Button>
    );
  };

  const content = (
    <Card className={cardClasses}>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle className={titleClasses}>{title}</CardTitle>
        </div>
        <CardDescription>{errorMessage}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Button onClick={reset} variant="default" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <NavigationButton />
        </div>
        {error.digest && (
          <p className="text-xs text-muted-foreground text-center font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className={containerClasses}>
      {layout === "container" ? (
        <div className={innerWrapperClasses}>{content}</div>
      ) : (
        content
      )}
    </div>
  );
}
