import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-(--page-gutter)">
      <EmptyState
        as="h1"
        eyebrow="404"
        title="Page not found"
        description="We can’t find the page you’re looking for."
        action={{
          label: "Back to the home page",
          href: "/",
          variant: "outline",
        }}
      />
    </main>
  );
}
