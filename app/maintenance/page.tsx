import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-(--page-gutter)">
      <Empty>
        <EmptyHeader>
          <p className="num font-mono text-label text-muted-foreground">
            Maintenance
          </p>
          <EmptyTitle className="font-display text-page-title text-foreground">
            <h1>Down for maintenance</h1>
          </EmptyTitle>
          <EmptyDescription>
            Rext AI is being updated. We&apos;ll be back shortly; thank you for
            your patience.
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
