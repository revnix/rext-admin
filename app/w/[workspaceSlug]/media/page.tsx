"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckSquare,
  Filter,
  Grid3x3,
  Image as ImageIcon,
  List,
  Plus,
  RefreshCw,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { MediaDetailSheet } from "@/components/media/media-detail-sheet";
import { MediaFolderSidebar } from "@/components/media/media-folder-sidebar";
import { MediaGrid } from "@/components/media/media-grid";
import { MediaList } from "@/components/media/media-list";
import { MediaUploadDialog } from "@/components/media/media-upload-dialog";
import { PageLayout } from "@/components/page-layout";
import { CanAccess } from "@/components/permissions/can-access";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useWorkspacePermission } from "@/hooks/use-permission";
import { apiClient } from "@/lib/api-client";
import type { Media, MediaListParams } from "@/lib/api-client/media";
import { formatFileSize } from "@/lib/formatters/number-formatters";
import { MEDIA_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";

/**
 * Workspace Media Library Page
 *
 * Displays and manages workspace media files.
 * Features upload, browse, search, filter, and organize media.
 */
export default function WorkspaceMediaPage() {
  const { workspace, workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  // Permissions (with loading)
  const { hasPermission: canUploadMedia, isLoading: isUploadPermLoading } =
    useWorkspacePermission(MEDIA_PERMISSIONS.CREATE, workspaceId);
  const { hasPermission: canDeleteMedia, isLoading: isDeletePermLoading } =
    useWorkspacePermission(MEDIA_PERMISSIONS.DELETE, workspaceId);

  // Determine if permission check still loading
  const isPermissionLoading = isUploadPermLoading || isDeletePermLoading;

  // UI States
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter states
  const [fileType, setFileType] = useState<
    "all" | "image" | "document" | "video"
  >("all");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Build query params
  const queryParams: MediaListParams = {
    page: 1,
    per_page: 50,
    ...(fileType !== "all" && { file_type: fileType }),
  };

  // Fetch media list
  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["media", workspace?.id, queryParams],
    queryFn: () => apiClient.media.list(workspace?.id || "", queryParams),
    enabled: !!workspace?.id,
    staleTime: 60 * 1000,
  });

  // Fetch storage usage
  const { data: usageResponse } = useQuery({
    queryKey: ["media-usage", workspace?.id],
    queryFn: () => apiClient.media.getUsage(workspace?.id || ""),
    enabled: !!workspace?.id,
    staleTime: 5 * 60 * 1000,
  });

  const mediaList = response?.items || [];
  const usage = usageResponse;

  // Filter by folder and search query (client-side)
  let filteredMedia = mediaList;

  // Filter by folder
  if (selectedFolder !== null) {
    filteredMedia = filteredMedia.filter(
      (m) => (m.folder || "") === selectedFolder,
    );
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredMedia = filteredMedia.filter(
      (m) =>
        m.title?.toLowerCase().includes(q) ||
        m.original_filename.toLowerCase().includes(q) ||
        m.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }

  // Helpers
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["media", workspace?.id] });
    queryClient.invalidateQueries({ queryKey: ["media-usage", workspace?.id] });
  };
  const handleUploaded = () => handleRefresh();
  const handleDeleted = () => handleRefresh();

  // local `formatFileSize` declaration is removed.

  // Bulk delete
  const bulkDeleteMutation = useMutation({
    mutationFn: (mediaIds: string[]) =>
      apiClient.media.bulkDelete(workspace?.id || "", mediaIds),
    onSuccess: (res) => {
      toast.success(res.message || "Media deleted successfully");
      handleRefresh();
      setSelectedIds(new Set());
      setSelectionMode(false);
    },
    onError: (err: Error) => toast.error(`Failed to delete: ${err.message}`),
  });

  // Selection handlers
  const handleSelectionChange = (mediaId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      selected ? newSet.add(mediaId) : newSet.delete(mediaId);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredMedia.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMedia.map((m) => m.id)));
    }
  };

  const handleBulkDelete = (): void => {
    if (selectedIds.size === 0) {
      toast.error("No media files selected");
      return;
    }
    if (confirm(`Delete ${selectedIds.size} media file(s)?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  // Header actions
  const headerActions = selectionMode ? (
    <>
      <span className="text-sm text-muted-foreground">
        {selectedIds.size} selected
      </span>
      <Button variant="outline" size="sm" onClick={handleSelectAll}>
        {selectedIds.size === filteredMedia.length
          ? "Deselect All"
          : "Select All"}
      </Button>
      {canDeleteMedia && (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleBulkDelete}
          disabled={selectedIds.size === 0 || bulkDeleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete ({selectedIds.size})
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={handleCancelSelection}>
        <X className="h-4 w-4 mr-2" />
        Cancel
      </Button>
    </>
  ) : (
    <>
      <div className="flex items-center gap-1 border rounded-md">
        <Button
          variant={viewMode === "grid" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setViewMode("grid")}
          className="rounded-r-none"
        >
          <Grid3x3 className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setViewMode("list")}
          className="rounded-l-none"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setSelectionMode(true)}
      >
        <CheckSquare className="h-4 w-4 mr-2" />
        Select
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isLoading}
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      </Button>

      {canUploadMedia && (
        <Button onClick={() => setShowUploadDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Media
        </Button>
      )}
    </>
  );

  // 🧩 Prevent flicker: wait until permission check is done
  if (!workspace?.id || isPermissionLoading) {
    return (
      <PageLayout title="Loading Permissions...">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Media Library"
      description="Upload and manage your workspace media files."
      actions={headerActions}
    >
      <CanAccess
        permission={MEDIA_PERMISSIONS.READ}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don’t have permission to view media in this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permission:{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  media:read
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        <div className="space-y-6">
          {/* Storage Usage Warning */}
          {usage && usage.usage_percentage >= 80 && (
            <Alert
              variant={usage.usage_percentage >= 95 ? "destructive" : "default"}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {usage.usage_percentage >= 95
                  ? "Storage Limit Reached"
                  : "Storage Almost Full"}
              </AlertTitle>
              <AlertDescription>
                You’ve used {usage.usage_percentage.toFixed(1)}% of your storage
                limit ({formatFileSize(usage.total_size)} /{" "}
                {formatFileSize(usage.storage_limit)}).{" "}
                {usage.usage_percentage >= 95
                  ? "Please delete some files or upgrade your plan."
                  : "Consider upgrading soon."}
              </AlertDescription>
            </Alert>
          )}

          {/* Media Section */}
          <Card>
            <CardHeader>
              <CardTitle>Media Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                {/* Folder Sidebar */}
                <MediaFolderSidebar
                  media={mediaList}
                  selectedFolder={selectedFolder}
                  onFolderSelect={setSelectedFolder}
                />

                {/* Main Section */}
                <div className="flex-1">
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Input
                      placeholder="Search by name, tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Select
                      value={fileType}
                      onValueChange={(
                        val: "all" | "image" | "document" | "video",
                      ) => setFileType(val)}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="File type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="image">Images</SelectItem>
                        <SelectItem value="document">Documents</SelectItem>
                        <SelectItem value="video">Videos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Media Grid / List */}
                  {error ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg border-destructive/50">
                      <ImageIcon className="h-12 w-12 text-destructive mb-4" />
                      <p className="text-lg font-medium mb-2 text-destructive">
                        Failed to load media
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        There was an error loading the media library.
                      </p>
                      <Button variant="outline" onClick={handleRefresh}>
                        Try Again
                      </Button>
                    </div>
                  ) : viewMode === "grid" ? (
                    <MediaGrid
                      media={filteredMedia}
                      onSelect={setSelectedMedia}
                      isLoading={isLoading}
                      selectedIds={selectedIds}
                      onSelectionChange={handleSelectionChange}
                      selectionMode={selectionMode}
                    />
                  ) : (
                    <MediaList
                      media={filteredMedia}
                      onSelect={setSelectedMedia}
                      isLoading={isLoading}
                      selectedIds={selectedIds}
                      onSelectionChange={handleSelectionChange}
                      selectionMode={selectionMode}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Dialog */}
          <MediaUploadDialog
            workspaceId={workspace?.id || ""}
            open={showUploadDialog}
            onOpenChange={setShowUploadDialog}
            onUploaded={handleUploaded}
          />

          {/* Detail Sheet */}
          <MediaDetailSheet
            workspaceId={workspace?.id || ""}
            media={selectedMedia}
            open={!!selectedMedia}
            onOpenChange={(open) => !open && setSelectedMedia(null)}
            onDeleted={handleDeleted}
          />
        </div>
      </CanAccess>
    </PageLayout>
  );
}
