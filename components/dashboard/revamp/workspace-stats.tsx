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
    <Card className="shadow-none border border-slate-100 bg-white rounded-2xl overflow-hidden">
      {/* Header Section */}
      <div className="bg-slate-50 p-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              Current Workspace
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
              <ExternalLink className="h-3.5 w-3.5" />
              <a
                href={website}
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
          <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <Users className="h-4 w-4" />
              </div>
              <span className="font-medium text-slate-600">Members</span>
            </div>
            <span className="font-bold text-slate-900">{membersCount}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <FileText className="h-4 w-4" />
              </div>
              <span className="font-medium text-slate-600">Words</span>
            </div>
            <span className="font-bold text-slate-900">{wordCount}</span>
          </div>
        </div>

        <div className="pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400 justify-center mb-4">
            <Calendar className="h-3.5 w-3.5" />
            <span>Created {createdAt}</span>
          </div>

          <Link
            href={
              workspace?.slug
                ? workspaceRoutes.settings.root(workspace.slug)
                : "/settings"
            }
          >
            <Button
              variant="outline"
              className="w-full h-11 rounded-xl border-slate-200 hover:bg-slate-50 hover:text-primary font-medium"
            >
              <Settings className="h-4 w-4 mr-2" />
              Workspace Settings
            </Button>
          </Link>

          <div className="text-center mt-3">
            <Link
              href="/"
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Switch Workspace
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
