import {
  Bell,
  Plus,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PlaceholderPage } from "@/components/placeholder-page";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "Integrations", href: "/integrations" },
    { label: "Notifications" },
  ];


  const columns = [
    { key: "name", header: "Channel Name", width: "200px" },
    { key: "type", header: "Type", width: "150px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "lastUsed", header: "Last Used", width: "150px" },
    { key: "created", header: "Created", width: "120px" },
  ];

  const emptyActions = [
    { label: "Configure Channels", icon: <Plus className="h-4 w-4" /> },
  ];

  const tableActions = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Configure Channels
    </Button>
  );

  return (
    <PageLayout
      title="Notifications"
      description="Configure notification channels for Human-in-the-Loop workflow interactions and alerts."
      breadcrumbs={breadcrumbs}
    >
      <PlaceholderPage
        columns={columns}
        emptyTitle="No notification channels configured"
        emptyDescription="Set up notification channels to receive alerts when flows require human intervention or approval."
        emptyActions={emptyActions}
        emptyIcon={<Bell className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search channels..."
        tableActions={tableActions}
      />
    </PageLayout>
  );
}
