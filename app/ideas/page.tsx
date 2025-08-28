import { PageLayout } from "@/components/page-layout"
import { PlaceholderPage } from "@/components/placeholder-page"
import { Button } from "@/components/ui/button"
import { Library, Plus, Filter, Lightbulb, CheckCircle, Clock, AlertCircle } from "lucide-react"

export default function IdeasPage() {
  const breadcrumbs = [
    { label: "Library", href: "#" },
    { label: "Ideas" },
  ]

  const stats = [
    { title: "Total Ideas", value: "12", icon: Lightbulb },
    { title: "In Progress", value: "5", icon: Clock },
    { title: "Completed", value: "4", icon: CheckCircle },
    { title: "On Hold", value: "3", icon: AlertCircle },
  ]

  const dummyData = [
    {
      name: "AI-powered Content Generator",
      category: "Product Feature",
      status: "In Progress",
      priority: "High",
      created: "Dec 15, 2024",
      updated: "Dec 20, 2024"
    },
    {
      name: "Customer Feedback Analysis Tool",
      category: "Analytics",
      status: "Completed",
      priority: "Medium",
      created: "Nov 28, 2024",
      updated: "Dec 18, 2024"
    },
    {
      name: "Mobile App Dark Mode",
      category: "UI/UX",
      status: "In Progress",
      priority: "Low",
      created: "Dec 10, 2024",
      updated: "Dec 19, 2024"
    },
    {
      name: "Real-time Collaboration Feature",
      category: "Product Feature",
      status: "On Hold",
      priority: "High",
      created: "Dec 5, 2024",
      updated: "Dec 12, 2024"
    },
    {
      name: "Advanced Search Filters",
      category: "Search",
      status: "In Progress",
      priority: "Medium",
      created: "Dec 8, 2024",
      updated: "Dec 21, 2024"
    },
    {
      name: "Email Newsletter Automation",
      category: "Marketing",
      status: "Completed",
      priority: "Low",
      created: "Nov 15, 2024",
      updated: "Dec 1, 2024"
    },
    {
      name: "Multi-language Support",
      category: "Internationalization",
      status: "On Hold",
      priority: "Medium",
      created: "Oct 20, 2024",
      updated: "Nov 30, 2024"
    }
  ]

  const columns = [
    { key: "name", header: "Idea Name", width: "250px" },
    { key: "category", header: "Category", width: "150px" },
    { key: "status", header: "Status", width: "120px" },
    { key: "priority", header: "Priority", width: "100px" },
    { key: "created", header: "Created", width: "120px" },
    { key: "updated", header: "Updated", width: "120px" },
  ]

  const emptyActions = [
    { label: "Add Idea", icon: <Plus className="h-4 w-4" /> },
    { label: "Import Ideas", variant: "outline" as const, icon: <Filter className="h-4 w-4" /> },
    { label: "Browse Templates", variant: "outline" as const, icon: <Library className="h-4 w-4" /> },
  ]

  const tableActions = (
    <>
      <Button variant="outline">
        <Filter className="h-4 w-4 mr-2" />
        Filter
      </Button>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Add Idea
      </Button>
    </>
  )

  return (
    <PageLayout
      title="Ideas"
      description="Browse, organize, and manage your collection of ideas. Transform concepts into actionable plans."
      breadcrumbs={breadcrumbs}
    >
      <PlaceholderPage
        stats={stats}
        columns={columns}
        data={dummyData}
        emptyTitle="No ideas yet"
        emptyDescription="Start building your idea collection. Add your first idea or import existing concepts."
        emptyActions={emptyActions}
        searchPlaceholder="Search ideas..."
        tableActions={tableActions}
      />
    </PageLayout>
  )
}