import { PageLayout } from "@/components/page-layout"
import { PlaceholderPage } from "@/components/placeholder-page"
import { Button } from "@/components/ui/button"
import { Settings2, Save, RotateCcw, Download } from "lucide-react"

export default function GeneralSettingsPage() {
  const breadcrumbs = [
    { label: "Settings", href: "#" },
    { label: "General" },
  ]

  return (
    <PageLayout
      title="General Settings"
      description="Configure global application settings, preferences, and system-wide options."
      breadcrumbs={breadcrumbs}
      actions={
        <>
          <Button variant="outline"><RotateCcw className="h-4 w-4 mr-2" />Reset</Button>
          <Button><Save className="h-4 w-4 mr-2" />Save Changes</Button>
        </>
      }
    >
      <PlaceholderPage
        title="Application Configuration"
        icon={<Settings2 className="h-8 w-8 text-muted-foreground" />}
        features={[
          "Theme and appearance settings",
          "Language and localization",
          "Timezone and date formats",
          "Security and privacy options",
          "System preferences",
          "Backup and restore settings"
        ]}
        actions={[
          { label: "Save Settings", icon: <Save className="h-4 w-4" /> },
          { label: "Export Config", variant: "outline" as const, icon: <Download className="h-4 w-4" /> },
          { label: "Reset to Default", variant: "outline" as const, icon: <RotateCcw className="h-4 w-4" /> },
        ]}
      />
    </PageLayout>
  )
}