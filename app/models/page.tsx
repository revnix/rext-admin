import { PageLayout } from "@/components/page-layout"
import { PlaceholderPage } from "@/components/placeholder-page"
import { Button } from "@/components/ui/button"
import { Bot, Plus, Download, Zap, CheckCircle, AlertCircle, Clock } from "lucide-react"

export default function ModelsPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "AI & Prompts", href: "/ai-prompts" },
    { label: "Models" },
  ]

  const stats = [
    { title: "Total Models", value: "8", icon: Bot },
    { title: "Active", value: "6", icon: CheckCircle },
    { title: "Testing", value: "1", icon: Clock },
    { title: "Issues", value: "1", icon: AlertCircle },
  ]

  const dummyData = [
    {
      name: "GPT-4 Turbo",
      provider: "OpenAI",
      type: "Chat",
      status: "Active",
      usage: "2.3K",
      cost: "$142.50",
      updated: "Dec 21, 2024"
    },
    {
      name: "Claude 3.5 Sonnet",
      provider: "Anthropic",
      type: "Chat",
      status: "Active",
      usage: "1.8K",
      cost: "$89.20",
      updated: "Dec 20, 2024"
    },
    {
      name: "GPT-3.5 Turbo",
      provider: "OpenAI",
      type: "Chat",
      status: "Active",
      usage: "5.2K",
      cost: "$45.80",
      updated: "Dec 19, 2024"
    },
    {
      name: "DALL-E 3",
      provider: "OpenAI",
      type: "Image",
      status: "Active",
      usage: "342",
      cost: "$68.40",
      updated: "Dec 18, 2024"
    },
    {
      name: "Gemini Pro",
      provider: "Google",
      type: "Chat",
      status: "Testing",
      usage: "45",
      cost: "$2.30",
      updated: "Dec 17, 2024"
    },
    {
      name: "Claude 3 Haiku",
      provider: "Anthropic",
      type: "Chat",
      status: "Active",
      usage: "892",
      cost: "$12.45",
      updated: "Dec 16, 2024"
    },
    {
      name: "Mistral Large",
      provider: "Mistral",
      type: "Chat",
      status: "Issue",
      usage: "0",
      cost: "$0.00",
      updated: "Dec 12, 2024"
    },
    {
      name: "CodeLlama 70B",
      provider: "Meta",
      type: "Code",
      status: "Active",
      usage: "156",
      cost: "$8.90",
      updated: "Dec 15, 2024"
    }
  ]

  const columns = [
    { key: "name", header: "Model Name", width: "200px" },
    { key: "provider", header: "Provider", width: "120px" },
    { key: "type", header: "Type", width: "100px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "usage", header: "Usage", width: "100px" },
    { key: "cost", header: "Cost", width: "100px" },
    { key: "updated", header: "Updated", width: "120px" },
  ]

  const emptyActions = [
    { label: "Add Model", icon: <Plus className="h-4 w-4" /> },
    { label: "Import Config", variant: "outline" as const, icon: <Download className="h-4 w-4" /> },
    { label: "Test Models", variant: "outline" as const, icon: <Zap className="h-4 w-4" /> },
  ]

  const tableActions = (
    <>
      <Button variant="outline">
        <Zap className="h-4 w-4 mr-2" />
        Test Models
      </Button>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Add Model
      </Button>
    </>
  )

  return (
    <PageLayout
      title="AI Models"
      description="Configure and manage AI models, monitor performance, and optimize usage for your applications."
      breadcrumbs={breadcrumbs}
    >
      <PlaceholderPage
        stats={stats}
        columns={columns}
        data={dummyData}
        emptyTitle="No models configured"
        emptyDescription="Start by adding your first AI model or importing an existing configuration."
        emptyActions={emptyActions}
        searchPlaceholder="Search models..."
        tableActions={tableActions}
      />
    </PageLayout>
  )
}