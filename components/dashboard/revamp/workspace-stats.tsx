import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Workspace } from "@/types/workspace";
import { workspaceRoutes } from "@/lib/routes";
import { Settings, Building2, ExternalLink, Calendar } from "lucide-react";
import Link from "next/link";

interface WorkspaceStatsProps {
  workspace: Workspace | null;
}

export function WorkspaceStats({ workspace }: WorkspaceStatsProps) {
  // Mock data or use workspace real data where available
  const membersCount =
    workspace?.members_count ?? workspace?.team_metrics?.total_members ?? 0;
  const knowledgeCount =
    workspace?.knowledge_stats?.total ??
    workspace?.knowledge_counts?.total_knowledge_items ??
    0;
  const wordCount = workspace?.content_metrics?.total_words ?? 0;
  const createdAt = workspace?.created_at
    ? new Date(workspace.created_at).toLocaleDateString()
    : "1/15/2026";
  const website = "https://revnix.com/"; // Mock as real website data might not be readily available on workspace object yet in this way

  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-slate-700">
            Current Workspace
          </h3>
          <Building2 className="h-6 w-6 text-slate-400" />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-base">
            <span className="text-muted-foreground">Members</span>
            <span className="font-semibold">{membersCount}</span>
          </div>
          <div className="flex justify-between text-base">
            <span className="text-muted-foreground">Knowledge Items</span>
            <span className="font-semibold">{knowledgeCount}</span>
          </div>
          <div className="flex justify-between text-base">
            <span className="text-muted-foreground">Content Words</span>
            <span className="font-semibold">{wordCount}</span>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ExternalLink className="h-4 w-4" />
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-blue-600"
            >
              {website}
            </a>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Created {createdAt}</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href={
              workspace?.slug
                ? workspaceRoutes.settings.root(workspace.slug)
                : "/settings"
            }
          >
            <Button variant="outline" className="w-full gap-2">
              <Settings className="h-4 w-4" />
              Workspace Settings
            </Button>
          </Link>
          <div className="text-center">
            <Link
              href="/"
              className="text-sm font-medium text-slate-700 hover:underline"
            >
              Switch Workspace
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
