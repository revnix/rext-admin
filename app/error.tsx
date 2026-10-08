"use client";

import { useEffect } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { reportErrorScreen } from "@/lib/analytics-failures";

export default function RootError({
  error,
  reset: _reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // The screen of last resort, for a page with no error screen of its own: it is reported like
  // the others (lib/analytics-failures.ts).
  useEffect(() => {
    reportErrorScreen("page", error, "RootError");
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-(--page-gutter)">
      <EmptyState
        as="h1"
        eyebrow="Error"
        title="Something went wrong"
        description="This page hit an error. Go back to the home page and try again."
        action={{
          label: "Back to the home page",
          href: "/",
          variant: "outline",
        }}
      />
    </main>
  );
}
