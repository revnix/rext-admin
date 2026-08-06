"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { mediaQueries } from "@/lib/query-keys";
import type { MediaUploadParams } from "@/lib/api-client/media";
import { formatFileSize } from "@/lib/formatters/number-formatters";

const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_UPLOAD_SIZE_LABEL = "20MB";

interface MediaUploadDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded?: () => void;
}

export function MediaUploadDialog({
  workspaceId,
  open,
  onOpenChange,
  onUploaded,
}: MediaUploadDialogProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [folder, setFolder] = useState("");
  const [tags, setTags] = useState("");

  // Fetch storage usage to check quota
  const { data: usageResponse } = useQuery({
    ...mediaQueries.usage(workspaceId),
    enabled: !!workspaceId && open,
    staleTime: 30 * 1000, // 30 seconds
  });

  const usage = usageResponse;
  const isStorageFull = usage && usage.usage_percentage >= 100;

  const { mutate: upload, isPending } = useMutation({
    mutationFn: async (params: MediaUploadParams) => {
      return apiClient.media.upload(workspaceId, params);
    },
    onSuccess: () => {
      toast.success("File uploaded successfully");
      queryClient.invalidateQueries({
        queryKey: mediaQueries.all(workspaceId),
      });
      handleClose();
      onUploaded?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload file");
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const uploadedFile = acceptedFiles[0];
        setFile(uploadedFile);
        // Auto-populate title from filename if not set
        if (!title) {
          setTitle(uploadedFile.name.replace(/\.[^/.]+$/, "")); // Remove extension
        }
      }
    },
    [title],
  );

  const handleRejectedFiles = useCallback((rejections: FileRejection[]) => {
    if (!rejections.length) {
      return;
    }

    const first = rejections[0];
    const tooLarge = first.errors.some(
      (error) => error.code === "file-too-large",
    );

    if (tooLarge) {
      toast.error(
        `File exceeds ${MAX_UPLOAD_SIZE_LABEL}. Please choose a smaller file.`,
      );
      return;
    }

    const reason = first.errors[0]?.message ?? "File is not supported.";
    toast.error(reason);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: handleRejectedFiles,
    maxFiles: 1,
    maxSize: MAX_UPLOAD_SIZE_BYTES,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      toast.error(
        `File exceeds ${MAX_UPLOAD_SIZE_LABEL}. Please choose a smaller file.`,
      );
      return;
    }

    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    upload({
      file,
      title: title || undefined,
      description: description || undefined,
      folder: folder || undefined,
      tags: tagList.length > 0 ? tagList : undefined,
    });
  };

  const handleClose = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setFolder("");
    setTags("");
    onOpenChange(false);
  };
  // local `formatFileSize` declaration is removed.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
            <DialogDescription>
              Upload images or documents to your media library
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Storage Warning */}
            {isStorageFull && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Storage limit reached. Please delete some files or upgrade
                  your plan to upload more media.
                </AlertDescription>
              </Alert>
            )}

            {usage &&
              usage.usage_percentage >= 90 &&
              usage.usage_percentage < 100 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Storage almost full ({usage.usage_percentage.toFixed(1)}%
                    used). Consider upgrading your plan soon.
                  </AlertDescription>
                </Alert>
              )}

            {/* File Upload Area */}
            <div>
              <Label>File *</Label>
              {!file ? (
                <div
                  {...getRootProps()}
                  className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  {isDragActive ? (
                    <p className="text-sm text-primary">
                      Drop your file here...
                    </p>
                  ) : (
                    <>
                      <p className="text-sm font-medium mb-1">
                        Drag & drop a file here, or click to select
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supported: Images (JPG, PNG, GIF, WebP), Documents (PDF,
                        TXT, MD)
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Max file size: {MAX_UPLOAD_SIZE_LABEL}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="mt-2 border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this media"
                className="mt-2"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description (optional)"
                rows={3}
                className="mt-2"
              />
            </div>

            {/* Folder */}
            <div>
              <Label htmlFor="folder">Folder</Label>
              <Input
                id="folder"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="e.g., images/products"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Organize media into folders
              </p>
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., product, banner, hero"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Comma-separated tags for easy searching
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!file || isPending || isStorageFull}
            >
              {isPending
                ? "Uploading..."
                : isStorageFull
                  ? "Storage Full"
                  : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
