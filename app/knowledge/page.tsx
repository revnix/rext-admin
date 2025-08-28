import { ArrowRight, Database, Plus, Search, Zap } from "lucide-react";
import Link from "next/link";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function KnowledgePage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "Knowledge" },
  ];

  const sections = [
    {
      title: "Rules",
      description:
        "Define business rules, automation triggers, and conditional logic for workflows.",
      icon: Zap,
      href: "/rules",
      stats: { active: "--", total: "--" },
      actions: ["Create Rules", "Test Logic", "Monitor Execution"],
    },
    {
      title: "Memories",
      description:
        "Store and retrieve contextual information and learned insights for AI interactions.",
      icon: Database,
      href: "/memories",
      stats: { stored: "--", recent: "--" },
      actions: ["Add Memories", "Search Context", "Manage Storage"],
    },
  ];

  return (
    <PageLayout
      title="Knowledge"
      description="Manage your knowledge base including business rules, contextual memories, and learned insights."
      breadcrumbs={breadcrumbs}
      actions={
        <>
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Search Knowledge
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Knowledge
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <Card
              key={section.title}
              className="hover:shadow-md transition-shadow"
            >
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
                        <div className="text-2xl font-bold text-muted-foreground">
                          {value}
                        </div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {key}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {section.actions.map((action, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
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

        {/* Knowledge Stats Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Knowledge Overview</CardTitle>
            <CardDescription>
              Summary of your knowledge base and recent activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                "Total Rules",
                "Active Memories",
                "Recent Updates",
                "Knowledge Score",
              ].map((stat) => (
                <div
                  key={stat}
                  className="text-center p-4 rounded-lg border border-dashed"
                >
                  <div className="text-2xl font-bold text-muted-foreground">
                    --
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stat}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
