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
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {INTEGRATIONS.map((integration) => (
            <Card
              key={integration.id}
              className={`cursor-pointer transition-all border shadow-none rounded-[2rem] overflow-hidden ${
                !integration.active
                  ? "opacity-60 cursor-not-allowed bg-slate-50 border-slate-100"
                  : selectedIntegration === integration.id
                    ? "border-primary ring-1 ring-primary bg-primary/5"
                    : "border-slate-100 hover:border-slate-300 hover:shadow-sm"
              }`}
              onClick={() =>
                handleIntegrationClick(integration.id, integration.active)
              }
            >
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4 p-8">
                <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white p-1 border border-slate-100 shadow-sm flex items-center justify-center">
                  {/* Fallback specific icons if external images fail, but using generic div for now to support SVGs */}
                  {/* biome-ignore lint/performance/noImgElement: External images without config */}
                  <img
                    src={integration.logo}
                    alt={integration.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold text-slate-900">
                    {integration.name}
                  </CardTitle>
                </div>
                {!integration.active && (
                  <Badge variant="secondary" className="rounded-full px-3">
                    Coming Soon
                  </Badge>
                )}
                {integration.active && (
                  <Badge variant="default" className="rounded-full px-3">
                    Active
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <CardDescription className="text-base">
                  {integration.description}
                </CardDescription>
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
