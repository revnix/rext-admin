import {
  Bot,
  Plus,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PlaceholderPage } from "@/components/placeholder-page";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ModelsPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "AI & Prompts", href: "/ai-prompts" },
    { label: "Models" },
  ];

  const columns = [
    { key: "name", header: "Model Name", width: "200px" },
    { key: "provider", header: "Provider", width: "120px" },
    { key: "type", header: "Type", width: "100px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "usage", header: "Usage", width: "100px" },
    { key: "cost", header: "Cost", width: "100px" },
    { key: "updated", header: "Updated", width: "120px" },
  ];

  const emptyActions = [
    { label: "Add Model", icon: <Plus className="h-4 w-4" />, href: "/models/add" },
  ];

  const tableActions = (
    <Button asChild>
      <Link href="/models/add">
        <Plus className="h-4 w-4 mr-2" />
        Add Model
      </Link>
    </Button>
  );

  return (
    <PageLayout
      title="AI Models"
      description="Configure and manage AI models, monitor performance, and optimize usage for your applications."
      breadcrumbs={breadcrumbs}
    >
      <PlaceholderPage
        columns={columns}
        data={[]}
        emptyTitle="No models configured"
        emptyDescription="Start by adding your first AI model or importing an existing configuration."
        emptyActions={emptyActions}
        emptyIcon={<Bot className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search models..."
        tableActions={tableActions}
      />
    </PageLayout>
  );
}
