import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Workspace } from "@/types/workspace";
import { workspaceRoutes } from "@/lib/routes";
import {
  Settings,
  Building2,
  ExternalLink,
  Calendar,
  Users,
  FileText,
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";

interface WorkspaceStatsProps {
  workspace: Workspace | null;
}

export function WorkspaceStats({ workspace }: WorkspaceStatsProps) {
  // Mock data or use workspace real data where available
  const membersCount =
    workspace?.members_count ?? workspace?.team_metrics?.total_members ?? 0;

  const wordCount = workspace?.content_metrics?.total_words ?? 0;
  const createdAt = workspace?.created_at
    ? new Date(workspace.created_at).toLocaleDateString()
    : "1/15/2026";
  const website = "https://revnix.com/";

  return (
    <Card className="border border-border bg-card overflow-hidden">
      {/* Header Section */}
      <div className="bg-muted/30 p-6 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-md bg-card border border-border flex items-center justify-center shadow-colored-sm">
            <Building2 className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">
              Current Workspace
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <ExternalLink className="h-3.5 w-3.5" />
              <a
                href={website as Route}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                {website}
              </a>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Users className="h-4 w-4" />
              </div>
              <span className="font-medium text-muted-foreground">Members</span>
            </div>
            <span className="font-bold text-foreground">{membersCount}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <span className="font-medium text-muted-foreground">Words</span>
            </div>
            <span className="font-bold text-foreground">{wordCount}</span>
          </div>
        </div>

        <div className="pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center mb-4">
            <Calendar className="h-3.5 w-3.5" />
            <span>Created {createdAt}</span>
          </div>

          <Link
            href={
              workspace?.slug
                ? (workspaceRoutes.settings.root(workspace.slug) as Route)
                : ("/settings" as Route)
            }
          >
            <Button
              variant="outline"
              className="w-full h-11 rounded-md border-border hover:bg-accent hover:text-accent-foreground font-medium"
            >
              <Settings className="h-4 w-4 mr-2" />
              Workspace Settings
            </Button>
          </Link>

          <div className="text-center mt-3">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Switch Workspace
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
