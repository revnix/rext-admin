"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Copy,
  Download,
  FileText,
  Folder,
  Trash2,
  User,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { apiClient } from "@/lib/api-client";
import type { Media } from "@/lib/api-client/media";

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

  const { mutate: deleteMedia, isPending: isDeleting } = useMutation({
    mutationFn: () => apiClient.media.delete(workspaceId, media?.id),
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

  if (!media) return null;

  const isImage = media.file_type.startsWith("image/");
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
    if (media.public_url) {
      navigator.clipboard.writeText(media.public_url);
      toast.success("URL copied to clipboard");
    }
  };

  const downloadFile = () => {
    if (media.public_url) {
      window.open(media.public_url, "_blank");
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{media.title || media.filename}</SheetTitle>
            <SheetDescription>
              {media.description || "Media file details"}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Preview */}
            {isImage && media.public_url && (
              <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
                <Image
                  src={media.public_url}
                  alt={media.alt_text || media.title || media.filename}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </div>
            )}

            {!isImage && (
              <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
                <FileText className="h-16 w-16 text-muted-foreground" />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyUrl}
                disabled={!media.public_url}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadFile}
                disabled={!media.public_url}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
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
            {(media.folder || media.tags.length > 0) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Organization</h3>

                {media.folder && (
                  <div className="flex items-start gap-2">
                    <Folder className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Folder</p>
                      <p className="text-sm">{media.folder}</p>
                    </div>
                  </div>
                )}

                {media.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {media.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {media.description && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Description</h3>
                <p className="text-sm text-muted-foreground">
                  {media.description}
                </p>
              </div>
            )}

            {/* Alt Text (for images) */}
            {media.alt_text && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Alt Text</h3>
                <p className="text-sm text-muted-foreground">
                  {media.alt_text}
                </p>
              </div>
            )}

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
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{media.title || media.filename}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMedia()}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
