import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-(--page-gutter)">
      <Empty>
        <EmptyHeader>
          <p className="num font-mono text-label text-muted-foreground">404</p>
          <EmptyTitle className="font-display text-page-title text-foreground">
            Page not found
          </EmptyTitle>
          <EmptyDescription>
            We can&apos;t find the page you&apos;re looking for.
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
