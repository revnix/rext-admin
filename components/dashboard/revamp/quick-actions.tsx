import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Lightbulb,
  FilePlus,
  BookOpen,
  UserPlus,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { workspaceRoutes } from "@/lib/routes"; // Use workspaceRoutes for dynamic links if possible, else fallback
import type { Workspace } from "@/types/workspace";

interface QuickActionsProps {
  workspace: Workspace | null;
}

export function QuickActions({ workspace }: QuickActionsProps) {
  const slug = workspace?.slug || "default";

  const actions = [
    {
      label: "Create Topic",
      icon: Lightbulb,
      href: slug !== "default" ? workspaceRoutes.topics(slug) : "/topics",
      color: "text-amber-500", // Keep for distinction
    },
    {
      label: "Add Content",
      icon: FilePlus,
      href: slug !== "default" ? workspaceRoutes.content(slug) : "/content", // Adjust as necessary
      color: "text-slate-600", // Simplified
    },
    {
      label: "Add Knowledge",
      icon: BookOpen,
      href: slug !== "default" ? workspaceRoutes.knowledge(slug) : "/knowledge",
      color: "text-slate-600", // Simplified
    },
    {
      label: "Invite Member",
      icon: UserPlus,
      href: slug !== "default" ? workspaceRoutes.members(slug) : "/members",
      color: "text-slate-600", // Simplified
    },
    {
      label: "Workspace Settings",
      icon: Settings,
      href:
        slug !== "default" ? workspaceRoutes.settings.root(slug) : "/settings",
      color: "text-slate-600",
    },
  ];

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
        <p className="text-base text-muted-foreground">
          Common tasks and shortcuts
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-50 transition-colors group"
          >
            <action.icon className={`h-5 w-5 ${action.color}`} />
            <span className="font-medium text-base text-slate-700 group-hover:text-slate-900">
              {action.label}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
