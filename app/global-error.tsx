"use client";

// This replaces the root layout when it fails, so it brings the stylesheet and the font variables itself.
import "./globals.css";
import { fontVariables } from "./fonts";
import { EmptyState } from "@/components/ui/empty-state";

export default function RootError({
  error: _error,
  reset: _reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <main className="flex min-h-screen items-center justify-center bg-background px-(--page-gutter)">
          <EmptyState
            as="h1"
            eyebrow="Error"
            title="Something went wrong"
            description="The app hit an error. Go back to the home page and try again."
            action={{
              label: "Back to the home page",
              href: "/",
              variant: "outline",
            }}
          />
        </main>
      </body>
    </html>
  );
}
