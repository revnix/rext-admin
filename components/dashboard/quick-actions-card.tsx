"use client";

import {
  BookOpen,
  FileText,
  Lightbulb,
  Settings,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CanAccess } from "@/components/permissions/can-access";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Workspace } from "@/types/workspace";

interface QuickActionsCardProps {
  workspace: Workspace | null;
}

export function QuickActionsCard({ workspace }: QuickActionsCardProps) {
  const workspaceSlug = workspace?.slug;

  const actions = [
    {
      label: "Create Topic",
      href: workspaceSlug
        ? `/workspaces/${workspaceSlug}/topics/create`
        : "/workspaces/create",
      icon: Lightbulb,
      enabled: !!workspaceSlug,
      color: "text-yellow-600",
    },
    {
      label: "Add Content",
      href: workspaceSlug
        ? `/workspaces/${workspaceSlug}/content`
        : "/workspaces/create",
      icon: FileText,
      enabled: !!workspaceSlug,
      color: "text-green-600",
    },
    {
      label: "Add Knowledge",
      href: workspaceSlug
        ? `/workspaces/${workspaceSlug}/knowledge`
        : "/workspaces/create",
      icon: BookOpen,
      enabled: !!workspaceSlug,
      color: "text-blue-600",
    },
    {
      label: "Invite Member",
      href: workspaceSlug
        ? `/workspaces/${workspaceSlug}/members`
        : "/workspaces/create",
      icon: UserPlus,
      enabled: !!workspaceSlug,
      color: "text-purple-600",
    },
    // Workspace Settings is rendered separately with permission gating below
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              asChild
              variant="ghost"
              className="w-full justify-start"
              disabled={!action.enabled}
            >
              <Link href={action.href}>
                <action.icon className={`h-4 w-4 mr-2 ${action.color}`} />
                {action.label}
              </Link>
            </Button>
          ))}

          {/* Gated: Workspace Settings (visible only with workspace.update) */}
          <CanAccess permission={WORKSPACE_PERMISSIONS.UPDATE} fallback={null}>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start"
              disabled={!workspaceSlug}
            >
              <Link
                href={
                  workspaceSlug
                    ? `/workspaces/${workspaceSlug}/settings`
                    : "/workspaces/create"
                }
              >
                <Settings className="h-4 w-4 mr-2 text-gray-600" />
                Workspace Settings
              </Link>
            </Button>
          </CanAccess>
        </div>
      </CardContent>
    </Card>
  );
}
