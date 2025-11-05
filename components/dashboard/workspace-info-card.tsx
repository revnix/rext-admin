"use client";

import {
  Building2,
  Calendar,
  ExternalLink,
  Globe,
  Settings,
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
import { Separator } from "@/components/ui/separator";
import type { Workspace } from "@/types/workspace";

interface WorkspaceInfoCardProps {
  workspace: Workspace | null;
}

export function WorkspaceInfoCard({ workspace }: WorkspaceInfoCardProps) {
  if (!workspace) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Current Workspace</CardTitle>
          <CardDescription>No workspace selected</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/workspaces/create">
              <Building2 className="h-4 w-4 mr-2" />
              Create Workspace
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Workspace
            </CardTitle>
            <h3 className="text-lg font-semibold mt-1">{workspace.title}</h3>
          </div>
          <Building2 className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Members</span>
            <span className="font-medium">
              {workspace.members_count ??
                workspace.team_metrics?.total_members ??
                0}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Knowledge Items</span>
            <span className="font-medium">
              {workspace.knowledge_stats?.total ??
                workspace.knowledge_counts?.total_knowledge_items ??
                0}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Content Words</span>
            <span className="font-medium">
              {workspace.content_metrics?.total_words?.toLocaleString() ?? 0}
            </span>
          </div>
        </div>

        <Separator />

        {/* Workspace Details */}
        <div className="space-y-3">
          {workspace.url && (
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <a
                href={workspace.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate flex items-center gap-1"
              >
                <span className="truncate">{workspace.url}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          )}
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-sm text-muted-foreground">
              Created {new Date(workspace.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <CanAccess permission={WORKSPACE_PERMISSIONS.UPDATE} fallback={null}>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={`/workspaces/${workspace.slug}/settings`}>
                <Settings className="h-4 w-4 mr-2" />
                Workspace Settings
              </Link>
            </Button>
          </CanAccess>
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/w">Switch Workspace</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
