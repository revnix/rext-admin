import {
  AlertCircle,
  CheckCircle,
  Link,
  Plus,
  RefreshCw,
  Share2,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PlaceholderPage } from "@/components/placeholder-page";
import { Button } from "@/components/ui/button";

export default function SocialAccountsPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "Integrations", href: "/integrations" },
    { label: "Social Accounts" },
  ];

  const stats = [
    { title: "Connected Accounts", value: "7", icon: Share2 },
    { title: "Active", value: "6", icon: CheckCircle },
    { title: "Syncing", value: "1", icon: RefreshCw },
    { title: "Issues", value: "0", icon: AlertCircle },
  ];

  const columns = [
    { key: "platform", header: "Platform", width: "150px" },
    { key: "account", header: "Account", width: "200px" },
    { key: "status", header: "Status", width: "120px" },
    { key: "followers", header: "Followers", width: "120px" },
    { key: "lastSync", header: "Last Sync", width: "150px" },
    { key: "connected", header: "Connected", width: "120px" },
  ];

  const emptyActions = [
    { label: "Connect Account", icon: <Link className="h-4 w-4" /> },
    {
      label: "Import Accounts",
      variant: "outline" as const,
      icon: <Plus className="h-4 w-4" />,
    },
    {
      label: "Sync All",
      variant: "outline" as const,
      icon: <RefreshCw className="h-4 w-4" />,
    },
  ];

  const tableActions = (
    <>
      <Button variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Sync All
      </Button>
      <Button>
        <Link className="h-4 w-4 mr-2" />
        Connect Account
      </Button>
    </>
  );

  return (
    <PageLayout
      title="Social Accounts"
      description="Connect and manage your social media accounts for seamless content publishing and engagement."
      breadcrumbs={breadcrumbs}
    >
      <PlaceholderPage
        stats={stats}
        columns={columns}
        emptyTitle="No social accounts connected"
        emptyDescription="Start by connecting your first social media account to begin publishing and managing content."
        emptyActions={emptyActions}
        searchPlaceholder="Search accounts..."
        tableActions={tableActions}
      />
    </PageLayout>
  );
}
