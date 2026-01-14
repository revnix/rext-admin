"use client";

import { useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WordPressConfiguration } from "@/components/integrations/wordpress-configuration";

const INTEGRATIONS = [
  {
    id: "wordpress",
    name: "WordPress",
    description: "Connect your WordPress site to sync content.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/98/WordPress_blue_logo.svg",
    active: true,
  },
  {
    id: "webflow",
    name: "Webflow",
    description: "Sync content directly to your Webflow CMS.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e5/Webflow_logo_2023.svg",
    active: false,
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Generate product descriptions and blog posts.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg",
    active: false,
  },
];

export default function IntegrationsPage() {
  const { workspace, workspaceSlug } = useWorkspace();
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(
    null,
  );

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Integrations" },
  ];

  const handleIntegrationClick = (id: string, active: boolean) => {
    if (!active) return;
    setSelectedIntegration(selectedIntegration === id ? null : id);
  };

  return (
    <PageLayout
      title="Integrations"
      description="Connect your workspace with third-party platforms."
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INTEGRATIONS.map((integration) => (
            <Card
              key={integration.id}
              className={`cursor-pointer transition-all border-2 shadow-none ${
                !integration.active
                  ? "opacity-60 cursor-not-allowed bg-slate-50"
                  : selectedIntegration === integration.id
                    ? "border-primary ring-1 ring-primary"
                    : "hover:border-slate-300"
              }`}
              onClick={() =>
                handleIntegrationClick(integration.id, integration.active)
              }
            >
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                <div className="relative h-10 w-10 overflow-hidden rounded-md">
                  {/* Fallback specific icons if external images fail, but using generic div for now to support SVGs */}
                  {/* biome-ignore lint/performance/noImgElement: External images without config */}
                  <img
                    src={integration.logo}
                    alt={integration.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">
                    {integration.name}
                  </CardTitle>
                </div>
                {!integration.active && (
                  <Badge variant="secondary">Coming Soon</Badge>
                )}
                {integration.active && <Badge variant="default">Active</Badge>}
              </CardHeader>
              <CardContent>
                <CardDescription>{integration.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedIntegration === "wordpress" && (
          <Card className="animate-in fade-in slide-in-from-top-4 duration-300">
            <CardHeader>
              <CardTitle>WordPress Configuration</CardTitle>
              <CardDescription>
                Configure your WordPress connection settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WordPressConfiguration />
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
