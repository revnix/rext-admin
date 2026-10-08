"use client";

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import type { ErrorInfo, ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { PageFrame } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { log } from "@/lib/logger";

/**
 * The one error boundary (design/app-language.md §8): a part of a page that throws shows a danger
 * Notice in its place, saying what happened, with Try again. Trying again also retries the
 * TanStack queries that failed inside it. A route segment's own error.tsx uses RouteError instead.
 */
export function ErrorBoundary({
  children,
  title = "This part of the page didn't load",
  onRetry,
  onError,
  resetKeys,
  framed = false,
}: {
  children: ReactNode;
  /** What failed, in the Notice's title: "The editor didn't load". */
  title?: string;
  /** After the boundary resets, before its children render again. */
  onRetry?: () => void;
  onError?: (error: unknown, info: ErrorInfo) => void;
  /** The boundary resets itself when one of these changes. */
  resetKeys?: unknown[];
  /** Around a whole page in the shell: the Notice sits in the page's frame, with its gutters. */
  framed?: boolean;
}) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ReactErrorBoundary
          resetKeys={resetKeys}
          onReset={() => {
            reset();
            onRetry?.();
          }}
          onError={(error, info) => {
            log.error("ErrorBoundary caught an error:", {
              message: error instanceof Error ? error.message : String(error),
              componentStack: info.componentStack,
            });
            onError?.(error, info);
          }}
          fallbackRender={({ resetErrorBoundary }) => {
            const notice = (
              <Notice
                tone="danger"
                title={title}
                action={
                  <Button
                    data-rec="show"
                    size="sm"
                    variant="outline"
                    onClick={resetErrorBoundary}
                  >
                    Try again
                  </Button>
                }
              >
                Try again, or reload the page if it keeps happening.
              </Notice>
            );
            return framed ? <PageFrame>{notice}</PageFrame> : notice;
          }}
        >
          {children}
        </ReactErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
