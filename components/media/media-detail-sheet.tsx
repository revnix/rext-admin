"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Copy,
  Download,
  Edit,
  ExternalLink,
  FileText,
  Folder,
  Maximize2,
  Save,
  Trash2,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CanAccess } from "@/components/permissions/can-access";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import type { Media } from "@/lib/api-client/media";
import { MEDIA_PERMISSIONS } from "@/lib/permissions";

interface MediaDetailSheetProps {
  workspaceId: string;
  media: Media | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function MediaDetailSheet({
  workspaceId,
  media,
  open,
  onOpenChange,
  onDeleted,
}: MediaDetailSheetProps) {
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAltText, setEditAltText] = useState("");
  const [editFolder, setEditFolder] = useState("");
  const [editTags, setEditTags] = useState("");

  // Initialize edit fields when media changes
  useState(() => {
    if (media) {
      setEditTitle(media.title || "");
      setEditDescription(media.description || "");
      setEditAltText(media.alt_text || "");
      setEditFolder(media.folder || "");
      setEditTags(media.tags.join(", "));
    }
  });

  const { mutate: deleteMedia, isPending: isDeleting } = useMutation({
    mutationFn: () => {
      if (!media?.id) throw new Error("Media ID is required");
      return apiClient.media.delete(workspaceId, media.id);
    },
    onSuccess: () => {
      toast.success("Media deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["media", workspaceId] });
      onOpenChange(false);
      onDeleted?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete media");
    },
  });

  const { mutate: updateMedia, isPending: isUpdating } = useMutation({
    mutationFn: () => {
      if (!media?.id) throw new Error("Media ID is required");
      const tagList = editTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      return apiClient.media.update(workspaceId, media.id, {
        title: editTitle || undefined,
        description: editDescription || undefined,
        alt_text: editAltText || undefined,
        folder: editFolder || undefined,
        tags: tagList.length > 0 ? tagList : undefined,
      });
    },
    onSuccess: () => {
      toast.success("Media updated successfully");
      queryClient.invalidateQueries({ queryKey: ["media", workspaceId] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update media");
    },
  });

  const handleCancelEdit = () => {
    // Reset to original values
    if (media) {
      setEditTitle(media.title || "");
      setEditDescription(media.description || "");
      setEditAltText(media.alt_text || "");
      setEditFolder(media.folder || "");
      setEditTags(media.tags.join(", "));
    }
    setIsEditing(false);
  };

  // Fetch media usage information
  const { data: usageResponse } = useQuery({
    queryKey: ["media-usage", workspaceId, media?.id],
    queryFn: () => {
      if (!media?.id) return null;
      return apiClient.media.getMediaUsage(workspaceId, media.id);
    },
    enabled: !!workspaceId && !!media?.id && open,
  });

  const usage = usageResponse?.data;

  if (!media) return null;

  const isImage = media.file_type.startsWith("image/");

  // Convert relative URLs to absolute URLs pointing to backend
  const getAbsoluteUrl = (url: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url; // Already absolute
    }
    // Relative URL - prepend backend URL
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://127.0.0.1:2024";
    return `${backendUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const publicUrl = getAbsoluteUrl(media.public_url);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyUrl = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      toast.success("URL copied to clipboard");
    }
  };

  const downloadFile = () => {
    if (publicUrl) {
      window.open(publicUrl, "_blank");
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-6">
          <SheetHeader className="space-y-2 pb-4">
            <SheetTitle>
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter title"
                  className="text-lg font-semibold"
                />
              ) : (
                media.title || media.filename
              )}
            </SheetTitle>
            <SheetDescription>
              {isEditing ? (
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={2}
                />
              ) : (
                media.description || "Media file details"
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Preview */}
            {isImage && publicUrl && (
              <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden group">
                <Image
                  src={publicUrl}
                  alt={media.alt_text || media.title || media.filename}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
                {/* Fullscreen button overlay */}
                <button
                  type="button"
                  onClick={() => setShowFullscreen(true)}
                  className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  title="View fullscreen"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            )}

            {!isImage && (
              <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
                <FileText className="h-16 w-16 text-muted-foreground" />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {!isEditing ? (
                <>
                  <CanAccess
                    permission={MEDIA_PERMISSIONS.UPDATE}
                    showLockedTooltip
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </CanAccess>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyUrl}
                    disabled={!publicUrl}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadFile}
                    disabled={!publicUrl}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <CanAccess
                    permission={MEDIA_PERMISSIONS.DELETE}
                    showLockedTooltip
                    showLockIcon
                  >
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </CanAccess>
                </>
              ) : (
                <>
                  <CanAccess
                    permission={MEDIA_PERMISSIONS.UPDATE}
                    showLockedTooltip
                  >
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => updateMedia()}
                      disabled={isUpdating}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isUpdating ? "Saving..." : "Save"}
                    </Button>
                  </CanAccess>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
            </div>

            {/* File Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">File Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Filename</p>
                  <p className="text-sm font-medium break-all">
                    {media.original_filename}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    File Size
                  </p>
                  <p className="text-sm font-medium">
                    {formatFileSize(media.file_size)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    File Type
                  </p>
                  <p className="text-sm font-medium">{media.file_type}</p>
                </div>

                {media.width && media.height && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Dimensions
                    </p>
                    <p className="text-sm font-medium">
                      {media.width} × {media.height} px
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Storage</p>
                  <p className="text-sm font-medium capitalize">
                    {media.storage_backend}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge
                    variant={
                      media.processing_status === "completed"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {media.processing_status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Organization */}
            {(isEditing || media.folder || media.tags.length > 0) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Organization</h3>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Folder
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editFolder}
                      onChange={(e) => setEditFolder(e.target.value)}
                      placeholder="e.g., images/products"
                      className="mt-1"
                    />
                  ) : (
                    media.folder && (
                      <div className="flex items-start gap-2 mt-1">
                        <Folder className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <p className="text-sm">{media.folder}</p>
                      </div>
                    )
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Tags</Label>
                  {isEditing ? (
                    <Input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="tag1, tag2, tag3"
                      className="mt-1"
                    />
                  ) : (
                    media.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {media.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Alt Text (for images) */}
            {(isEditing && isImage) || media.alt_text ? (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Alt Text {isImage && "(Accessibility)"}
                </Label>
                {isEditing ? (
                  <Textarea
                    value={editAltText}
                    onChange={(e) => setEditAltText(e.target.value)}
                    placeholder="Describe this image for accessibility"
                    rows={2}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {media.alt_text}
                  </p>
                )}
              </div>
            ) : null}

            {/* Metadata */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Metadata</h3>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm">{formatDate(media.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Last Modified
                    </p>
                    <p className="text-sm">{formatDate(media.updated_at)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Uploaded by</p>
                    <p className="text-sm">User ID: {media.user_id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Access Control */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Access Control</h3>
              <div className="flex items-center gap-2">
                <Badge variant={media.is_public ? "default" : "secondary"}>
                  {media.is_public ? "Public" : "Private"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {media.access_level}
                </span>
              </div>
            </div>

            {/* Used In (Content References) */}
            {usage && usage.total_usages > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">
                  Used In ({usage.total_usages}{" "}
                  {usage.total_usages === 1 ? "place" : "places"})
                </h3>

                {usage.featured_in.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Featured Image
                    </p>
                    <div className="space-y-2">
                      {usage.featured_in.map((content) => (
                        <Link
                          key={content.id}
                          href={`/workspaces/${workspaceId}/content/${content.id}`}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {content.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {content.status}
                            </p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {usage.used_in_content.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Inline Content
                    </p>
                    <div className="space-y-2">
                      {usage.used_in_content.map((content) => (
                        <Link
                          key={`${content.id}-${content.position || 0}`}
                          href={`/workspaces/${workspaceId}/content/${content.id}`}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {content.title}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">
                                {content.status}
                              </p>
                              {content.usage_type && (
                                <Badge variant="outline" className="text-xs">
                                  {content.usage_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {usage && usage.total_usages === 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Used In</h3>
                <p className="text-sm text-muted-foreground">
                  This media file is not currently used in any content.
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Fullscreen Image Viewer */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95">
          <DialogTitle className="sr-only">
            {media?.title || media?.filename} - Fullscreen View
          </DialogTitle>
          <div className="relative w-full h-[95vh] flex items-center justify-center">
            {isImage && publicUrl && (
              <Image
                src={publicUrl}
                alt={media.alt_text || media.title || media.filename}
                fill
                className="object-contain"
                sizes="100vw"
                quality={100}
              />
            )}
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors z-10"
              title="Close fullscreen"
            >
              <X className="h-6 w-6" />
            </button>
            {/* Image info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
              <p className="text-lg font-medium">
                {media.title || media.filename}
              </p>
              {media.description && (
                <p className="text-sm text-gray-300 mt-1">
                  {media.description}
                </p>
              )}
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                {media.width && media.height && (
                  <span>
                    {media.width} × {media.height} px
                  </span>
                )}
                <span>{formatFileSize(media.file_size)}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {usage && usage.total_usages > 0 ? (
                <div className="space-y-2">
                  <div className="text-destructive font-medium">
                    ⚠️ This media file is currently used in {usage.total_usages}{" "}
                    {usage.total_usages === 1 ? "place" : "places"}!
                  </div>
                  <div>
                    Deleting "{media.title || media.filename}" will break{" "}
                    {usage.featured_in.length > 0 && (
                      <span>
                        {usage.featured_in.length} featured{" "}
                        {usage.featured_in.length === 1 ? "image" : "images"}
                      </span>
                    )}
                    {usage.featured_in.length > 0 &&
                      usage.used_in_content.length > 0 &&
                      " and "}
                    {usage.used_in_content.length > 0 && (
                      <span>
                        {usage.used_in_content.length} inline{" "}
                        {usage.used_in_content.length === 1
                          ? "reference"
                          : "references"}
                      </span>
                    )}
                    .
                  </div>
                  <div className="text-sm">
                    Are you absolutely sure you want to proceed?
                  </div>
                </div>
              ) : (
                <div>
                  Are you sure you want to delete "
                  {media.title || media.filename}"? This action cannot be
                  undone.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMedia()}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Anyway"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
