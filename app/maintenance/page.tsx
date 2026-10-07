import { EmptyState } from "@/components/ui/empty-state";

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-(--page-gutter)">
      <EmptyState
        as="h1"
        eyebrow="Maintenance"
        title="Down for maintenance"
        description="Rext AI is being updated. We’ll be back shortly; thank you for your patience."
        action={{
          label: "Back to the home page",
          href: "/",
          variant: "outline",
        }}
      />
    </main>
  );
}
