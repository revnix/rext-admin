import {
  Archive,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function MemoriesPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "Knowledge", href: "/knowledge" },
    { label: "Memories" },
  ];

  const columns = [
    { key: "title", header: "Memory Title", width: "300px" },
    { key: "category", header: "Category", width: "150px" },
    { key: "type", header: "Type", width: "120px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "expires", header: "Expires", width: "120px" },
    { key: "created", header: "Created", width: "120px" },
  ];

  const emptyActions: Array<{
    label: string;
    icon?: React.ReactNode;
    variant?: "default" | "outline" | "secondary";
    href?: string;
  }> = [];

  const tableActions = null;

  return (
    <PageLayout
      title="Memories"
      description="View and manage auto-generated memories from your flow executions and AI interactions."
      breadcrumbs={breadcrumbs}
    >
      <PlaceholderPage
        columns={columns}
        data={[]}
        emptyTitle="No memories generated yet"
        emptyDescription="Memories will be automatically generated and stored when you run flows that process information and create contextual insights."
        emptyActions={emptyActions}
        emptyIcon={<Archive className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search memories..."
        tableActions={tableActions}
      />
    </PageLayout>
  );
}
