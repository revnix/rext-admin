import { Plus, Zap } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PlaceholderPage } from "@/components/placeholder-page";
import { Button } from "@/components/ui/button";

export default function RulesPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "Knowledge", href: "/knowledge" },
    { label: "Rules" },
  ];


  const columns = [
    { key: "name", header: "Rule Name", width: "250px" },
    { key: "trigger", header: "Trigger", width: "200px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "executions", header: "Executions", width: "100px" },
    { key: "lastRun", header: "Last Run", width: "150px" },
    { key: "created", header: "Created", width: "120px" },
  ];

  const emptyActions = [
    { label: "Create Rule", icon: <Plus className="h-4 w-4" /> },
  ];

  const tableActions = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Create Rule
    </Button>
  );

  return (
    <PageLayout
      title="Rules"
      description="Define and manage business rules, automation triggers, and conditional logic for your workflows."
      breadcrumbs={breadcrumbs}
    >
      <PlaceholderPage
        columns={columns}
        emptyTitle="No rules created yet"
        emptyDescription="Start by creating your first business rule to automate workflows and processes."
        emptyActions={emptyActions}
        emptyIcon={<Zap className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search rules..."
        tableActions={tableActions}
      />
    </PageLayout>
  );
}
