import {
  AlertCircle,
  CheckCircle,
  Link,
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
    { title: "Connected Accounts", value: "--", icon: Share2 },
    { title: "Active", value: "--", icon: CheckCircle },
    { title: "Syncing", value: "--", icon: RefreshCw },
    { title: "Issues", value: "--", icon: AlertCircle },
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
  ];

  const tableActions = (
    <Button>
      <Link className="h-4 w-4 mr-2" />
      Connect Account
    </Button>
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
        emptyIcon={<Share2 className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search accounts..."
        tableActions={tableActions}
      />
    </PageLayout>
  );
}
