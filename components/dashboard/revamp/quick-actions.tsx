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
      color: "bg-muted text-foreground",
    },
    {
      label: "Create New Persona",
      icon: FileEdit,
      href: slug !== "default" ? `/w/${slug}/personas` : "/personas",
      color: "bg-muted text-foreground",
    },
    {
      label: "Workspace Settings",
      icon: Settings,
      href:
        slug !== "default" ? workspaceRoutes.settings.root(slug) : "/settings",
      color: "bg-muted text-foreground",
    },
    {
      label: "Visit Website",
      icon: ExternalLink,
      href: workspace?.url || "#",
      color: "bg-muted text-foreground",
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-4 p-6">
        <CardTitle className="text-base font-semibold text-foreground">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="flex flex-col gap-1">
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
                className="flex items-center justify-between p-3 -mx-3 rounded-md hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-md flex items-center justify-center ${action.color}`}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-medium text-sm text-foreground block">
                      {action.label}
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      Perform task
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
