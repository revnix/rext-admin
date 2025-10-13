"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Filter,
  FolderOpen,
  Image as ImageIcon,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { MediaDetailSheet } from "@/components/media/media-detail-sheet";
import { MediaGrid } from "@/components/media/media-grid";
import { MediaUploadDialog } from "@/components/media/media-upload-dialog";
import { PageLayout } from "@/components/page-layout";
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

  // Filter states
  const [fileType, setFileType] = useState<
    "all" | "image" | "document" | "video"
  >("all");
  const [folder, setFolder] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Build query params
  const queryParams: MediaListParams = {
    page: 1,
    per_page: 50,
  };

  if (fileType !== "all") {
    queryParams.file_type = fileType;
  }

  if (folder) {
    queryParams.folder = folder;
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
  const pagination = response?.pagination;
  const usage = usageResponse?.data;

  // Filter by search query (client-side)
  const filteredMedia = searchQuery
    ? mediaList.filter(
        (m) =>
          m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.original_filename
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          m.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      )
    : mediaList;

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
  };

  const breadcrumbs = [
    { label: "Workspaces", href: "/workspaces" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Media Library" },
  ];

  const headerActions = (
    <>
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
              {pagination?.total || 0}{" "}
              {pagination?.total === 1 ? "file" : "files"} in{" "}
              {workspace?.title || "this workspace"}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                onValueChange={(value: "all" | "image" | "document" | "video") =>
                  setFileType(value)
                }
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

              {/* Folder Filter */}
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by folder..."
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full sm:w-[200px]"
                />
              </div>
            </div>

            {/* Media Grid */}
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
            ) : (
              <MediaGrid
                media={filteredMedia}
                onSelect={setSelectedMedia}
                isLoading={isLoading}
              />
            )}
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
    </PageLayout>
  );
}
