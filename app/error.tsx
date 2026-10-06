"use client";

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
    <main className="flex min-h-screen items-center justify-center bg-background px-(--page-gutter)">
      <Empty>
        <EmptyHeader>
          <p className="num font-mono text-label text-muted-foreground">
            Error
          </p>
          <EmptyTitle className="font-display text-page-title text-foreground">
            Something went wrong
          </EmptyTitle>
          <EmptyDescription>
            This page hit an error. Go back to the home page and try again.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline">
            <Link href="/">Back to the home page</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
