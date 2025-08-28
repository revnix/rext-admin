import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, MessageSquare, ArrowRight, Plus, Settings } from "lucide-react"
import Link from "next/link"

export default function AIPromptsPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "AI & Prompts" },
  ]

  const sections = [
    {
      title: "Models",
      description: "Configure and manage AI models, monitor performance, and optimize usage.",
      icon: Bot,
      href: "/models",
      stats: { total: "--", active: "--" },
      actions: ["Configure Models", "Monitor Performance", "Manage API Keys"]
    },
    {
      title: "Prompt Templates", 
      description: "Create and manage reusable prompt templates for consistent AI interactions.",
      icon: MessageSquare,
      href: "/prompt-templates", 
      stats: { total: "--", templates: "--" },
      actions: ["Create Templates", "Import Prompts", "Test Prompts"]
    }
  ]

  return (
    <PageLayout
      title="AI & Prompts"
      description="Central hub for managing AI models, prompt templates, and related configurations."
      breadcrumbs={breadcrumbs}
      actions={
        <>
          <Button variant="outline"><Settings className="h-4 w-4 mr-2" />AI Settings</Button>
          <Button><Plus className="h-4 w-4 mr-2" />Quick Setup</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <Card key={section.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <section.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                  <Link href={section.href}>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    {Object.entries(section.stats).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-2xl font-bold text-muted-foreground">{value}</div>
                        <div className="text-sm text-muted-foreground capitalize">{key}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {section.actions.map((action, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                        {action}
                      </div>
                    ))}
                  </div>
                  <Link href={section.href}>
                    <Button variant="outline" className="w-full">
                      Manage {section.title}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common AI and prompt management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-4">
              <Button variant="outline" className="justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Add Model
              </Button>
              <Button variant="outline" className="justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Create Template
              </Button>
              <Button variant="outline" className="justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Test Configuration
              </Button>
              <Button variant="outline" className="justify-start">
                <Bot className="h-4 w-4 mr-2" />
                Monitor Usage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}