"use client";

import { FileText, Globe, Upload } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Workspace } from "@/types/workspace";

interface WorkspaceKnowledgeSummaryCardProps {
  workspace: Workspace;
}

export function WorkspaceKnowledgeSummaryCard({
  workspace,
}: WorkspaceKnowledgeSummaryCardProps) {
  // Use knowledge_stats from API if available, otherwise fallback to array lengths
  const webCount =
    workspace.knowledge_stats?.web_knowledge ?? workspace.websites?.length ?? 0;
  const fileCount =
    workspace.knowledge_stats?.files ?? workspace.knowledge_files?.length ?? 0;
  const textCount =
    workspace.knowledge_stats?.text_knowledge ??
    workspace.text_knowledge?.length ??
    0;
  const totalCount =
    workspace.knowledge_stats?.total ?? webCount + fileCount + textCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Knowledge Base</CardTitle>
        <CardDescription>
          Content and information stored in this workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Globe className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{webCount}</div>
              <div className="text-sm text-muted-foreground">Web URLs</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Upload className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{fileCount}</div>
              <div className="text-sm text-muted-foreground">Files</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <FileText className="h-8 w-8 text-purple-500" />
            <div>
              <div className="text-2xl font-bold">{textCount}</div>
              <div className="text-sm text-muted-foreground">Text Notes</div>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Total Knowledge Items
            </span>
            <span className="text-lg font-semibold">{totalCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
