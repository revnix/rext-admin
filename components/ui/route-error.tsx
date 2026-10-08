"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageFrame } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { analytics } from "@/lib/analytics";
import { errorProperties, pathShape } from "@/lib/analytics-failures";
import { log } from "@/lib/logger";
import { cn } from "@/lib/utils";

/**
 * A route segment's error.tsx (design/app-language.md §8): what happened, Try again, and one way out.
 * Inside the shell (`layout="container"`) it is a danger Notice in the page's frame, so the sidebar
 * and the header stay; under a layout.tsx that already renders a page layout (settings) it is the
 * Notice alone (`layout="inline"`); on a page of its own (`layout="fullscreen"`, the sign-in pages)
 * it is an EmptyState with the title as the page's h1. The error's own message is logged, not shown: it can be
 * a stack line or a backend detail. The digest is shown, for support.
 *
 * @example
 * // In app/admin/error.tsx
 * export default function AdminError(props) {
 *   return <RouteError {...props} title="Admin panel error" logContext="AdminError" layout="container" />;
 * }
 */
export interface RouteErrorProps {
  /** The error object from Next.js error boundary */
  error: Error & { digest?: string };
  /** Function to attempt recovery by re-rendering the segment */
  reset: () => void;
  title?: string;
  description?: string;
  /** Context string for logging (e.g., "AdminError", "DashboardError") */
  logContext?: string;
  /** Type of navigation for the secondary action */
  navigationType?: "link" | "back";
  /** Link href when navigationType is "link" */
  navigationLink?: string;
  /** Label for the navigation button */
  navigationLabel?: string;
  /** "container" inside the shell, "inline" inside a page layout, "fullscreen" for a page of its own */
  layout?: "fullscreen" | "container" | "inline";
}

export function RouteError({
  error,
  reset,
  title = "Something went wrong",
  description = "This page hit an error. Try again, or go back and try again later.",
  logContext = "RouteError",
  navigationType = "link",
  navigationLink = "/",
  navigationLabel = "Home",
  layout = "fullscreen",
}: RouteErrorProps) {
  const router = useRouter();

  useEffect(() => {
    log.error(`[${logContext}]`, error);
    // That a person met this screen, where, and the error's class: never its message.
    analytics.track("error_screen_shown", {
      where: "page",
      context: logContext,
      route: pathShape(window.location.pathname),
      ...errorProperties(error),
    });
  }, [error, logContext]);

  const actions = (align: "start" | "center") => (
    <div
      className={cn(
        "flex flex-wrap gap-2",
        align === "center" && "justify-center",
      )}
    >
      <Button data-rec="show" onClick={reset}>
        Try again
      </Button>
      {navigationType === "back" ? (
        <Button data-rec="show" variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      ) : (
        <Button asChild variant="outline">
          <Link href={navigationLink as Route}>{navigationLabel}</Link>
        </Button>
      )}
    </div>
  );

  if (layout !== "fullscreen") {
    const notice = (
      <Notice tone="danger" title={title}>
        <p>{description}</p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs">Error ID: {error.digest}</p>
        )}
        <div className="mt-3">{actions("start")}</div>
      </Notice>
    );
    return layout === "inline" ? notice : <PageFrame>{notice}</PageFrame>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-(--page-gutter)">
      <EmptyState
        as="h1"
        eyebrow={error.digest ? `Error ${error.digest}` : "Error"}
        title={title}
        description={description}
        action={actions("center")}
      />
    </main>
  );
}
