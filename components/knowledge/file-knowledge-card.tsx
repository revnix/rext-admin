"use client";

import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  File,
  FileSpreadsheet,
  FileText,
  Image,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fileKnowledgeService } from "@/services/knowledge-api";
import { useFileKnowledgeStore } from "@/stores/knowledge-store";
import type { FileKnowledge } from "@/types/workspace";

interface FileKnowledgeCardProps {
  item: FileKnowledge;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

interface FileKnowledgeListItemProps {
  item: FileKnowledge;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

// File type icon mapping
const getFileIcon = (mimeType: string) => {
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("image")) return Image;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return FileSpreadsheet;
  if (mimeType.includes("word") || mimeType.includes("document"))
    return FileText;
  if (mimeType.includes("text")) return FileText;
  return File;
};

// Status color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "processing":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "uploading":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "failed":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

// Status icon mapping
const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return CheckCircle;
    case "processing":
    case "uploading":
      return Loader2;
    case "failed":
      return AlertCircle;
    default:
      return Clock;
  }
};

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

// Format file extension from MIME type or filename
const getFileExtension = (fileName: string, mimeType: string) => {
  const extension = fileName.split(".").pop();
  if (extension) return extension.toUpperCase();

  // Fallback to MIME type
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word")) return "DOC";
  if (mimeType.includes("spreadsheet")) return "XLS";
  if (mimeType.includes("text")) return "TXT";
  return "FILE";
};

export function FileKnowledgeCard({
  item,
  onSelect,
  isSelected = false,
}: FileKnowledgeCardProps) {
  const [_isDeleting, setIsDeleting] = useState(false);
  const removeItem = useFileKnowledgeStore((state) => state.removeItem);

  const FileIcon = getFileIcon(item.type);
  const StatusIcon = getStatusIcon(item.status);
  const statusColor = getStatusColor(item.status);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await fileKnowledgeService.delete(item.workspace_id, item.id);
      removeItem(item.id);
      toast.success(`File "${item.name}" deleted successfully`);
    } catch (error) {
      toast.error(
        `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = () => {
    if (item.path) {
      // Create download link
      const link = document.createElement("a");
      link.href = item.path;
      link.download = item.name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error("File not available for download");
    }
  };

  return (
    <Card
      className={`h-full transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary" : ""
      } ${onSelect ? "cursor-pointer" : ""}`}
      onClick={() => onSelect?.(item.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <CardTitle className="text-base font-medium truncate">
                {item.name}
              </CardTitle>
              <CardDescription className="text-sm">
                {getFileExtension(item.name, item.type)} •{" "}
                {formatFileSize(item.size)}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                disabled={!item.path}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <ConfirmationDialog
                title="Delete File"
                description={`Are you sure you want to delete "${item.name}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
                onConfirm={handleDelete}
              >
                <DropdownMenuItem
                  onClick={(e) => e.stopPropagation()}
                  className="text-destructive focus:text-destructive"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </ConfirmationDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Status Badge */}
          <Badge variant="outline" className={`${statusColor} border`}>
            <StatusIcon
              className={`mr-1 h-3 w-3 ${
                item.status === "processing" || item.status === "uploading"
                  ? "animate-spin"
                  : ""
              }`}
            />
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Badge>

          {/* Content Statistics */}
          {item.status === "completed" &&
            (item.char_count || item.word_count) && (
              <div className="text-xs text-muted-foreground space-y-1">
                {item.word_count && (
                  <div>{item.word_count.toLocaleString()} words</div>
                )}
                {item.char_count && (
                  <div>{item.char_count.toLocaleString()} characters</div>
                )}
              </div>
            )}

          {/* Upload Date */}
          <div className="text-xs text-muted-foreground">
            Uploaded {new Date(item.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FileKnowledgeListItem({
  item,
  onSelect,
  isSelected = false,
}: FileKnowledgeListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const removeItem = useFileKnowledgeStore((state) => state.removeItem);

  const FileIcon = getFileIcon(item.type);
  const StatusIcon = getStatusIcon(item.status);
  const statusColor = getStatusColor(item.status);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await fileKnowledgeService.delete(item.workspace_id, item.id);
      removeItem(item.id);
      toast.success(`File "${item.name}" deleted successfully`);
    } catch (error) {
      toast.error(
        `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = () => {
    if (item.path) {
      const link = document.createElement("a");
      link.href = item.path;
      link.download = item.name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error("File not available for download");
    }
  };

  return (
    <button
      type="button"
      className={`flex items-center gap-4 p-4 border rounded-lg transition-all hover:shadow-sm ${
        isSelected ? "ring-2 ring-primary" : ""
      } ${onSelect ? "cursor-pointer" : ""} w-full text-left`}
      onClick={() => onSelect?.(item.id)}
      disabled={!onSelect}
    >
      {/* File Icon */}
      <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />

      {/* File Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium truncate">{item.name}</h4>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${statusColor} text-xs`}>
              <StatusIcon
                className={`mr-1 h-3 w-3 ${
                  item.status === "processing" || item.status === "uploading"
                    ? "animate-spin"
                    : ""
                }`}
              />
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {getFileExtension(item.name, item.type)} •{" "}
            {formatFileSize(item.size)}
          </span>
          {item.status === "completed" && item.word_count && (
            <span>{item.word_count.toLocaleString()} words</span>
          )}
          <span>Uploaded {new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
          }
        }}
        role="toolbar"
        aria-label="File knowledge actions"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          disabled={!item.path}
          className="h-8"
        >
          <Download className="h-4 w-4" />
          <span className="sr-only">Download</span>
        </Button>
        <ConfirmationDialog
          title="Delete File"
          description={`Are you sure you want to delete "${item.name}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="destructive"
          onConfirm={handleDelete}
        >
          <Button
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            className="h-8 text-destructive hover:text-destructive"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="sr-only">Delete</span>
          </Button>
        </ConfirmationDialog>
      </div>
    </button>
  );
}
