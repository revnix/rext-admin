import { PageLayout } from "@/components/page-layout"
import { PlaceholderPage } from "@/components/placeholder-page"
import { Button } from "@/components/ui/button"
import { MessageSquare, Plus, Copy, Edit3, CheckCircle, Clock, AlertCircle } from "lucide-react"

export default function PromptTemplatesPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "AI & Prompts", href: "/ai-prompts" },
    { label: "Prompt Templates" },
  ]

  const stats = [
    { title: "Total Templates", value: "32", icon: MessageSquare },
    { title: "Active", value: "28", icon: CheckCircle },
    { title: "Draft", value: "3", icon: Clock },
    { title: "Deprecated", value: "1", icon: AlertCircle },
  ]

  const columns = [
    { key: "name", header: "Template Name", width: "250px" },
    { key: "category", header: "Category", width: "150px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "usage", header: "Usage", width: "100px" },
    { key: "lastUsed", header: "Last Used", width: "150px" },
    { key: "created", header: "Created", width: "120px" },
  ]

  const emptyActions = [
    { label: "Create Template", icon: <Plus className="h-4 w-4" /> },
    { label: "Duplicate Template", variant: "outline" as const, icon: <Copy className="h-4 w-4" /> },
    { label: "Edit Template", variant: "outline" as const, icon: <Edit3 className="h-4 w-4" /> },
  ]

  const tableActions = (
    <>
      <Button variant="outline">
        <Copy className="h-4 w-4 mr-2" />
        Duplicate
      </Button>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Create Template
      </Button>
    </>
  )

  return (
    <PageLayout
      title="Prompt Templates"
      description="Create, manage, and optimize AI prompt templates for consistent and effective interactions."
      breadcrumbs={breadcrumbs}
    >
      <PlaceholderPage
        stats={stats}
        columns={columns}
        emptyTitle="No prompt templates created"
        emptyDescription="Build your first prompt template to improve AI interaction consistency and effectiveness."
        emptyActions={emptyActions}
        searchPlaceholder="Search templates..."
        tableActions={tableActions}
      />
    </PageLayout>
  )
}