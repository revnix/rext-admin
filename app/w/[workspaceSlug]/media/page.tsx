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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import type { Media, MediaListParams } from "@/lib/api-client/media";
import { MEDIA_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

/**
 * Workspace Media Library Page
 *
 * Displays and manages workspace media files.
 * Features upload, browse, search, filter, and organize media.
 */
export default function WorkspaceMediaPage() {
  const { workspace, workspaceSlug } = useWorkspace();
  const queryClient = useQueryClient();

  // UI states
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
  };

  if (fileType !== "all") {
    queryParams.file_type = fileType;
  }

  // Fetch media
  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["media", workspace?.id, queryParams],
    queryFn: () => apiClient.media.list(workspace?.id || "", queryParams),
    enabled: !!workspace?.id,
    staleTime: 1 * 60 * 1000,
  });

  // Fetch storage usage
  const { data: usageResponse } = useQuery({
    queryKey: ["media-usage", workspace?.id],
    queryFn: () => apiClient.media.getUsage(workspace?.id || ""),
    enabled: !!workspace?.id,
    staleTime: 5 * 60 * 1000,
  });

  const mediaList = response?.data || [];
  const usage = usageResponse?.data;

  // Filter by folder and search query (client-side)
  let filteredMedia = mediaList;

  // Filter by folder
  if (selectedFolder !== null) {
    filteredMedia = filteredMedia.filter((m) => {
      const itemFolder = m.folder || "";
      return itemFolder === selectedFolder;
    });
  }

  // Filter by search query
  if (searchQuery) {
    filteredMedia = filteredMedia.filter(
      (m) =>
        m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["media", workspace?.id] });
    queryClient.invalidateQueries({ queryKey: ["media-usage", workspace?.id] });
  };

  const handleUploaded = () => {
    handleRefresh();
  };

  const handleDeleted = () => {
    handleRefresh();
  };

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (mediaIds: string[]) =>
      apiClient.media.bulkDelete(workspace?.id || "", mediaIds),
    onSuccess: (response) => {
      toast.success(response.message);
      handleRefresh();
      setSelectedIds(new Set());
      setSelectionMode(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete media: ${error.message}`);
    },
  });

  // Selection handlers
  const handleSelectionChange = (mediaId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(mediaId);
      } else {
        newSet.delete(mediaId);
      }
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

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) {
      toast.error("No media files selected");
      return;
    }

    if (
      confirm(
        `Are you sure you want to delete ${selectedIds.size} media file(s)?`,
      )
    ) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
  };

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Media Library" },
  ];

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
      <Button
        variant="destructive"
        size="sm"
        onClick={handleBulkDelete}
        disabled={selectedIds.size === 0 || bulkDeleteMutation.isPending}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete ({selectedIds.size})
      </Button>
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
          <span className="sr-only">Grid view</span>
        </Button>
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setViewMode("list")}
          className="rounded-l-none"
        >
          <List className="h-4 w-4" />
          <span className="sr-only">List view</span>
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
      <Button onClick={() => setShowUploadDialog(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Upload Media
      </Button>
    </>
  );

  return (
    <PageLayout
      title="Media Library"
      description="Upload and manage your workspace media files"
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      <CanAccess
        permission={MEDIA_PERMISSIONS.READ}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to view media in this workspace.
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
          {/* Stats Cards */}
          {usage && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Files
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usage.total_files}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all types
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Storage Used
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatFileSize(usage.total_size)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {usage.usage_percentage.toFixed(1)}% of{" "}
                    {formatFileSize(usage.storage_limit)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {usage.by_type.image.count}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(usage.by_type.image.size)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {usage.by_type.document.count}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(usage.by_type.document.size)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Storage Quota Warning */}
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
                {usage.usage_percentage >= 95 ? (
                  <>
                    You've used {usage.usage_percentage.toFixed(1)}% of your
                    storage limit ({formatFileSize(usage.total_size)} /{" "}
                    {formatFileSize(usage.storage_limit)}). Please delete some
                    files or upgrade your plan to upload more media.
                  </>
                ) : (
                  <>
                    You've used {usage.usage_percentage.toFixed(1)}% of your
                    storage limit ({formatFileSize(usage.total_size)} /{" "}
                    {formatFileSize(usage.storage_limit)}). Consider upgrading
                    your plan soon.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Storage Progress Bar */}
          {usage && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Storage Usage
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {formatFileSize(usage.total_size)} /{" "}
                    {formatFileSize(usage.storage_limit)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Progress
                  value={usage.usage_percentage}
                  className={`h-2 ${
                    usage.usage_percentage >= 95
                      ? "[&>div]:bg-destructive"
                      : usage.usage_percentage >= 80
                        ? "[&>div]:bg-yellow-500"
                        : ""
                  }`}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {usage.usage_percentage.toFixed(1)}% used
                  {usage.usage_percentage < 100 && (
                    <>
                      {" "}
                      • {formatFileSize(usage.storage_limit - usage.total_size)}{" "}
                      remaining
                    </>
                  )}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Media Files</CardTitle>
              <CardDescription>
                {filteredMedia.length}{" "}
                {filteredMedia.length === 1 ? "file" : "files"}
                {selectedFolder !== null &&
                  ` in ${selectedFolder || "Uncategorized"}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                {/* Folder Sidebar */}
                <MediaFolderSidebar
                  media={mediaList}
                  selectedFolder={selectedFolder}
                  onFolderSelect={setSelectedFolder}
                />

                {/* Main Content Area */}
                <div className="flex-1">
                  {/* Filter Bar */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    {/* Search */}
                    <div className="flex-1">
                      <Input
                        placeholder="Search by name, tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    {/* File Type Filter */}
                    <Select
                      value={fileType}
                      onValueChange={(
                        value: "all" | "image" | "document" | "video",
                      ) => setFileType(value)}
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

                  {/* Media Grid/List */}
                  {error ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg border-destructive/50">
                      <ImageIcon className="h-12 w-12 text-destructive mb-4" />
                      <p className="text-lg font-medium mb-2 text-destructive">
                        Failed to load media
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        There was an error loading the media library
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
