"use client";

import { AlertCircle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
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

/**
 * Workspace Error Boundary
 *
 * Catches errors within workspace-scoped pages and displays a user-friendly error message.
 */
export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    log.error("[WorkspaceError] Error caught:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Workspace Error</CardTitle>
          </div>
          <CardDescription>
            {error.message || "An unexpected error occurred in this workspace"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Button onClick={reset} variant="default" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/workspaces">
                <Home className="h-4 w-4 mr-2" />
                Workspaces
              </Link>
            </Button>
          </div>
          {error.digest && (
            <p className="text-xs text-muted-foreground text-center">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
