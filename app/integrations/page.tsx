import { ArrowRight, Bell, Plus, Settings, Share2 } from "lucide-react";
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

export default function IntegrationsPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "Integrations" },
  ];

  const sections = [
    {
      title: "Social Accounts",
      description:
        "Connect and manage social media accounts for content publishing and engagement.",
      icon: Share2,
      href: "/social-accounts",
      stats: { connected: "--", platforms: "--" },
      actions: ["Connect Accounts", "Schedule Posts", "View Analytics"],
    },
    {
      title: "Notifications",
      description:
        "Configure notification channels and automation rules for timely updates.",
      icon: Bell,
      href: "/notifications",
      stats: { channels: "--", rules: "--" },
      actions: ["Setup Channels", "Create Rules", "View History"],
    },
  ];

  return (
    <PageLayout
      title="Integrations"
      description="Connect external services, manage integrations, and configure communication channels."
      breadcrumbs={breadcrumbs}
      actions={
        <>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Integration Settings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
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
                        key={`${section.title}-${action}-${index}`}
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

        {/* Available Integrations */}
        <Card>
          <CardHeader>
            <CardTitle>Available Integrations</CardTitle>
            <CardDescription>
              Popular services and platforms you can integrate with
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[
                "Twitter/X",
                "LinkedIn",
                "Facebook",
                "Instagram",
                "Slack",
                "Discord",
                "Email",
                "SMS",
                "Webhook",
                "Zapier",
                "GitHub",
                "Google Drive",
              ].map((integration) => (
                <div
                  key={integration}
                  className="flex items-center gap-2 p-3 rounded-lg border border-dashed"
                >
                  <div className="w-6 h-6 rounded bg-muted" />
                  <span className="text-sm text-muted-foreground">
                    {integration}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
