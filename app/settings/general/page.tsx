import { PageLayout } from "@/components/page-layout"
import { PlaceholderPage } from "@/components/placeholder-page"
import { Button } from "@/components/ui/button"
import { Settings2, Save, RotateCcw, Download, CheckCircle, Clock, AlertCircle } from "lucide-react"

export default function GeneralSettingsPage() {
  const breadcrumbs = [
    { label: "Settings", href: "#" },
    { label: "General" },
  ]

  const stats = [
    { title: "Total Settings", value: "24", icon: Settings2 },
    { title: "Configured", value: "20", icon: CheckCircle },
    { title: "Pending", value: "3", icon: Clock },
    { title: "Needs Attention", value: "1", icon: AlertCircle },
  ]

  const columns = [
    { key: "setting", header: "Setting", width: "250px" },
    { key: "category", header: "Category", width: "150px" },
    { key: "value", header: "Value", width: "200px" },
    { key: "status", header: "Status", width: "120px" },
    { key: "lastModified", header: "Last Modified", width: "150px" },
    { key: "modifiedBy", header: "Modified By", width: "120px" },
  ]

  const emptyActions = [
    { label: "Configure Settings", icon: <Settings2 className="h-4 w-4" /> },
    { label: "Import Config", variant: "outline" as const, icon: <Download className="h-4 w-4" /> },
    { label: "Reset to Default", variant: "outline" as const, icon: <RotateCcw className="h-4 w-4" /> },
  ]

  const tableActions = (
    <>
      <Button variant="outline">
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset
      </Button>
      <Button>
        <Save className="h-4 w-4 mr-2" />
        Save Changes
      </Button>
    </>
  )

  return (
    <PageLayout
      title="General Settings"
      description="Configure global application settings, preferences, and system-wide options."
      breadcrumbs={breadcrumbs}
    >
      <PlaceholderPage
        stats={stats}
        columns={columns}
        emptyTitle="No settings configured"
        emptyDescription="Start configuring your application settings to customize the system behavior."
        emptyActions={emptyActions}
        searchPlaceholder="Search settings..."
        tableActions={tableActions}
      />
    </PageLayout>
  )
}