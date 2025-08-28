import { PageLayout } from "@/components/page-layout"
import { PlaceholderPage } from "@/components/placeholder-page"
import { Button } from "@/components/ui/button"
import { Database, Plus, Search, Archive, CheckCircle, AlertTriangle } from "lucide-react"

export default function MemoriesPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "Knowledge", href: "/knowledge" },
    { label: "Memories" },
  ]

  const stats = [
    { title: "Total Memories", value: "24", icon: Database },
    { title: "Active", value: "18", icon: CheckCircle },
    { title: "Archived", value: "6", icon: Archive },
    { title: "Expiring Soon", value: "3", icon: AlertTriangle },
  ]

  const columns = [
    { key: "title", header: "Memory Title", width: "300px" },
    { key: "category", header: "Category", width: "150px" },
    { key: "type", header: "Type", width: "120px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "expires", header: "Expires", width: "120px" },
    { key: "created", header: "Created", width: "120px" },
  ]

  const dummyData = [
    {
      title: "Customer Support Best Practices",
      category: "Documentation",
      type: "Knowledge",
      status: "Active",
      expires: "Never",
      created: "Dec 10, 2024"
    },
    {
      title: "API Rate Limiting Rules",
      category: "Technical",
      type: "Context",
      status: "Active",
      expires: "Mar 15, 2025",
      created: "Dec 8, 2024"
    },
    {
      title: "Brand Guidelines and Tone",
      category: "Marketing",
      type: "Reference",
      status: "Active",
      expires: "Never",
      created: "Nov 25, 2024"
    },
    {
      title: "Security Protocol Updates",
      category: "Security",
      type: "Knowledge",
      status: "Active",
      expires: "Feb 1, 2025",
      created: "Dec 15, 2024"
    },
    {
      title: "User Onboarding Flow",
      category: "Process",
      type: "Context",
      status: "Active",
      expires: "Never",
      created: "Dec 5, 2024"
    },
    {
      title: "Legacy System Documentation",
      category: "Technical",
      type: "Reference",
      status: "Archived",
      expires: "Expired",
      created: "Oct 12, 2024"
    }
  ]

  const emptyActions = [
    { label: "Add Memory", icon: <Plus className="h-4 w-4" /> },
    { label: "Import Knowledge", variant: "outline" as const, icon: <Database className="h-4 w-4" /> },
    { label: "Browse Archives", variant: "outline" as const, icon: <Archive className="h-4 w-4" /> },
  ]

  const tableActions = (
    <>
      <Button variant="outline">
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Add Memory
      </Button>
    </>
  )

  return (
    <PageLayout
      title="Memories"
      description="Store and retrieve important information, context, and learned insights for AI interactions."
      breadcrumbs={breadcrumbs}
    >
      <PlaceholderPage
        stats={stats}
        columns={columns}
        data={dummyData}
        emptyTitle="No memories stored"
        emptyDescription="Start building your knowledge base by adding memories, context, and important information."
        emptyActions={emptyActions}
        searchPlaceholder="Search memories..."
        tableActions={tableActions}
      />
    </PageLayout>
  )
}