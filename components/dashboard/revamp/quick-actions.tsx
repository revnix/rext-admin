"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  UserPlus,
  FileEdit,
  Settings,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { workspaceRoutes } from "@/lib/routes";
import type { Workspace } from "@/types/workspace";
import type { Route } from "next";

interface QuickActionsProps {
  workspace: Workspace | null;
}

export function QuickActions({ workspace }: QuickActionsProps) {
  const slug = workspace?.slug || "default";

  const actions = [
    {
      label: "Invite Team Member",
      icon: UserPlus,
      href: slug !== "default" ? workspaceRoutes.members(slug) : "/members",
      description: "Add collaborators to this workspace",
    },
    {
      label: "Create New Persona",
      icon: FileEdit,
      href: slug !== "default" ? `/w/${slug}/personas` : "/personas",
      description: "Define a new audience profile",
    },
    {
      label: "Workspace Settings",
      icon: Settings,
      href:
        slug !== "default" ? workspaceRoutes.settings.root(slug) : "/settings",
      description: "Manage details and preferences",
    },
    {
      label: "Visit Website",
      icon: ExternalLink,
      href: workspace?.url || "#",
      description: "Open your site in a new tab",
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="p-6 pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        <div className="flex flex-col gap-0.5">
          {actions.map((action) => {
            // External websites must open in a new tab, never a same-tab
            // client-side navigation away from the dashboard.
            const isExternalUrl = /^https?:\/\//i.test(action.href);
            return (
              <Link
                key={action.href}
                href={action.href as Route}
                {...(isExternalUrl
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group flex items-center justify-between gap-3 rounded-md p-3 transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-foreground">
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <span className="block text-sm font-medium text-foreground">
                      {action.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {action.description}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
