import {
  Clock,
  Pause,
  Play,
  Plus,
  Workflow,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PlaceholderPage } from "@/components/placeholder-page";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FlowsPage() {
  const breadcrumbs = [{ label: "Create", href: "#" }, { label: "Flows" }];

  const stats = [
    { title: "Total Flows", value: "--", icon: Workflow },
    { title: "Active", value: "--", icon: Play },
    { title: "Paused", value: "--", icon: Pause },
    { title: "Scheduled", value: "--", icon: Clock },
  ];

  const columns = [
    { key: "name", header: "Flow Name", width: "300px" },
    { key: "status", header: "Status", width: "120px" },
    { key: "triggers", header: "Triggers", width: "150px" },
    { key: "lastRun", header: "Last Run", width: "150px" },
    { key: "created", header: "Created", width: "120px" },
  ];

  const emptyActions = [
    { label: "Create Flow", icon: <Plus className="h-4 w-4" />, href: "/flows/create" },
  ];

  const tableActions = (
    <Button asChild>
      <Link href="/flows/create">
        <Plus className="h-4 w-4 mr-2" />
        Create Flow
      </Link>
    </Button>
  );

  return (
    <PageLayout
      title="Flows"
      description="Create and manage automated workflows to streamline your processes and boost productivity."
      breadcrumbs={breadcrumbs}
    >
      <PlaceholderPage
        stats={stats}
        columns={columns}
        emptyTitle="No flows created yet"
        emptyDescription="Get started by creating your first automated workflow or importing a template."
        emptyActions={emptyActions}
        emptyIcon={<Workflow className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search flows..."
        tableActions={tableActions}
      />
    </PageLayout>
  );
}
