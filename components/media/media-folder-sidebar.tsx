"use client";

import { Folder, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Media } from "@/lib/api-client/media";

interface MediaFolderSidebarProps {
  media: Media[];
  selectedFolder: string | null;
  onFolderSelect: (folder: string | null) => void;
}

export function MediaFolderSidebar({
  media,
  selectedFolder,
  onFolderSelect,
}: MediaFolderSidebarProps) {
  // Extract unique folders from media
  const folderCounts = media.reduce(
    (acc, item) => {
      const folder = item.folder || "Uncategorized";
      acc[folder] = (acc[folder] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const folders = Object.entries(folderCounts).sort((a, b) => {
    // "Uncategorized" always at top
    if (a[0] === "Uncategorized") return -1;
    if (b[0] === "Uncategorized") return 1;
    return a[0].localeCompare(b[0]);
  });

  return (
    <div className="w-64 border-r bg-muted/30">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Folders</h3>
      </div>

      <ScrollArea className="h-[calc(100vh-20rem)]">
        <div className="p-2 space-y-1">
          {/* All Files */}
          <Button
            variant={selectedFolder === null ? "secondary" : "ghost"}
            className="w-full justify-start"
            size="sm"
            onClick={() => onFolderSelect(null)}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            <span className="flex-1 text-left">All Files</span>
            <Badge variant="secondary" className="ml-2">
              {media.length}
            </Badge>
          </Button>

          {/* Folder List */}
          {folders.map(([folder, count]) => {
            const isUncategorized = folder === "Uncategorized";
            const isSelected = isUncategorized
              ? selectedFolder === ""
              : selectedFolder === folder;

            return (
              <Button
                key={folder}
                variant={isSelected ? "secondary" : "ghost"}
                className="w-full justify-start"
                size="sm"
                onClick={() => onFolderSelect(isUncategorized ? "" : folder)}
              >
                <Folder className="h-4 w-4 mr-2" />
                <span className="flex-1 text-left truncate" title={folder}>
                  {folder}
                </span>
                <Badge variant="secondary" className="ml-2">
                  {count}
                </Badge>
              </Button>
            );
          })}

          {folders.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No folders yet
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
