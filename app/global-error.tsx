"use client";

// This replaces the root layout when it fails, so it brings the stylesheet and the font variables itself.
import "./globals.css";
import { fontVariables } from "./fonts";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

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
          <Empty>
            <EmptyHeader>
              <p className="num font-mono text-label text-muted-foreground">
                Error
              </p>
              <EmptyTitle className="font-display text-page-title text-foreground">
                {/* layout-ok: a page outside the shell, with no layout header to hold its title */}
                <h1>Something went wrong</h1>
              </EmptyTitle>
              <EmptyDescription>
                The app hit an error. Go back to the home page and try again.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild variant="outline">
                <Link href="/">Back to the home page</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </main>
      </body>
    </html>
  );
}
