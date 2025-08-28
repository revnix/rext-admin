import { PageLayout } from "@/components/page-layout"
import { PlaceholderPage } from "@/components/placeholder-page"
import { Button } from "@/components/ui/button"
import { Bell, Plus, Settings, Mail, CheckCircle, Clock, AlertCircle } from "lucide-react"

export default function NotificationsPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "Integrations", href: "/integrations" },
    { label: "Notifications" },
  ]

  const stats = [
    { title: "Total Rules", value: "14", icon: Bell },
    { title: "Active", value: "12", icon: CheckCircle },
    { title: "Pending", value: "1", icon: Clock },
    { title: "Failed", value: "1", icon: AlertCircle },
  ]

  const columns = [
    { key: "name", header: "Rule Name", width: "200px" },
    { key: "channel", header: "Channel", width: "150px" },
    { key: "trigger", header: "Trigger", width: "200px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "lastSent", header: "Last Sent", width: "150px" },
    { key: "created", header: "Created", width: "120px" },
  ]

  const emptyActions = [
    { label: "Create Rule", icon: <Plus className="h-4 w-4" /> },
    { label: "Email Setup", variant: "outline" as const, icon: <Mail className="h-4 w-4" /> },
    { label: "Settings", variant: "outline" as const, icon: <Settings className="h-4 w-4" /> },
  ]

  const tableActions = (
    <>
      <Button variant="outline">
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Create Rule
      </Button>
    </>
  )

  return (
    <PageLayout
      title="Notifications"
      description="Configure notification preferences, channels, and automation rules for timely updates."
      breadcrumbs={breadcrumbs}
    >
      <PlaceholderPage
        stats={stats}
        columns={columns}
        emptyTitle="No notification rules configured"
        emptyDescription="Set up your first notification rule to stay informed about important events and updates."
        emptyActions={emptyActions}
        searchPlaceholder="Search notification rules..."
        tableActions={tableActions}
      />
    </PageLayout>
  )
}