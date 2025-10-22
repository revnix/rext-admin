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
      href: workspaceSlug ? `/w/${workspaceSlug}/topics/create` : "/w/create",
      icon: Lightbulb,
      enabled: !!workspaceSlug,
      color: "text-yellow-600",
    },
    {
      label: "Add Content",
      href: workspaceSlug ? `/w/${workspaceSlug}/content` : "/w/create",
      icon: FileText,
      enabled: !!workspaceSlug,
      color: "text-green-600",
    },
    {
      label: "Add Knowledge",
      href: workspaceSlug ? `/w/${workspaceSlug}/knowledge` : "/w/create",
      icon: BookOpen,
      enabled: !!workspaceSlug,
      color: "text-blue-600",
    },
    {
      label: "Invite Member",
      href: workspaceSlug ? `/w/${workspaceSlug}/members` : "/w/create",
      icon: UserPlus,
      enabled: !!workspaceSlug,
      color: "text-purple-600",
    },
    {
      label: "Workspace Settings",
      href: workspaceSlug ? `/w/${workspaceSlug}/settings` : "/w/create",
      icon: Settings,
      enabled: !!workspaceSlug,
      color: "text-gray-600",
    },
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
        </div>
      </CardContent>
    </Card>
  );
}
