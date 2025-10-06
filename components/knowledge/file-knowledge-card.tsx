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
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useFileKnowledgeStore } from "@/stores/knowledge-store";
import type { FileKnowledge } from "@/types/workspace";
import {
  BaseKnowledgeCard,
  BaseKnowledgeListItem,
  formatCountLocale,
  formatDate,
  formatFileSize,
  getFileExtension,
  type KnowledgeCardConfig,
  type StatusConfig,
} from "./shared";

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

// Status configuration
const statusConfig: Record<FileKnowledge["status"], StatusConfig> = {
  pending: {
    icon: Clock,
    label: "Pending",
    variant: "outline",
    color: "text-gray-500",
  },
  uploading: {
    icon: Loader2,
    label: "Uploading",
    variant: "outline",
    color: "text-yellow-500",
    animate: true,
  },
  processing: {
    icon: Loader2,
    label: "Processing",
    variant: "outline",
    color: "text-blue-500",
    animate: true,
  },
  completed: {
    icon: CheckCircle,
    label: "Completed",
    variant: "outline",
    color: "text-green-500",
  },
  failed: {
    icon: AlertCircle,
    label: "Failed",
    variant: "outline",
    color: "text-red-500",
  },
};

export function FileKnowledgeCard({
  item,
  onSelect,
  isSelected = false,
}: FileKnowledgeCardProps) {
  const removeItem = useFileKnowledgeStore((state) => state.removeItem);

  const FileIcon = getFileIcon(item.type);

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

  const cardConfig: KnowledgeCardConfig<FileKnowledge> = {
    primaryIcon: FileIcon,
    getTitle: (item) => item.name,
    getDescription: (item) => (
      <>
        {getFileExtension(item.name, item.type)} • {formatFileSize(item.size)}
      </>
    ),
    getStatusConfig: (item) => statusConfig[item.status],
    getActions: (item) => [
      {
        icon: Download,
        label: "Download",
        onClick: (e) => {
          e.stopPropagation();
          handleDownload();
        },
        disabled: !item.path,
      },
      {
        icon: Trash2,
        label: "Delete",
        variant: "destructive" as const,
        onClick: () => {},
        confirmationConfig: {
          title: "Delete File",
          description: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
          confirmText: "Delete",
        },
      },
    ],
    getMetadataSections: (item) => [
      {
        id: "statistics",
        condition:
          item.status === "completed" && !!(item.char_count || item.word_count),
        content: (
          <div className="text-xs text-muted-foreground space-y-1">
            {item.word_count && (
              <div>{formatCountLocale(item.word_count)} words</div>
            )}
            {item.char_count && (
              <div>{formatCountLocale(item.char_count)} characters</div>
            )}
          </div>
        ),
      },
      {
        id: "upload-date",
        content: (
          <div className="text-xs text-muted-foreground">
            Uploaded {formatDate(item.created_at)}
          </div>
        ),
      },
    ],
    onDelete: async (item) => {
      await apiClient.knowledge.deleteFile(item.workspace_id, item.id);
      removeItem(item.id);
      toast.success(`File "${item.name}" deleted successfully`);
    },
  };

  return (
    <BaseKnowledgeCard
      item={item}
      config={cardConfig}
      onSelect={onSelect}
      isSelected={isSelected}
    />
  );
}

export function FileKnowledgeListItem({
  item,
  onSelect,
  isSelected = false,
}: FileKnowledgeListItemProps) {
  const removeItem = useFileKnowledgeStore((state) => state.removeItem);
  const FileIcon = getFileIcon(item.type);

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

  const listConfig = {
    primaryIcon: FileIcon,
    getTitle: (item: FileKnowledge) => item.name,
    getDescription: (item: FileKnowledge) => (
      <>
        {getFileExtension(item.name, item.type)} • {formatFileSize(item.size)}
      </>
    ),
    getStatusConfig: (item: FileKnowledge) => statusConfig[item.status],
    getActions: (item: FileKnowledge) => [
      {
        icon: Download,
        label: "Download",
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          handleDownload();
        },
        disabled: !item.path,
      },
      {
        icon: Trash2,
        label: "Delete",
        variant: "destructive" as const,
        onClick: () => {},
        confirmationConfig: {
          title: "Delete File",
          description: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
          confirmText: "Delete",
        },
      },
    ],
    getInlineActions: (item: FileKnowledge) => [
      {
        icon: Download,
        label: "Download",
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          handleDownload();
        },
        disabled: !item.path,
      },
      {
        icon: Trash2,
        label: "Delete",
        variant: "destructive" as const,
        onClick: () => {},
        confirmationConfig: {
          title: "Delete File",
          description: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
          confirmText: "Delete",
        },
      },
    ],
    getMetadataSections: () => [],
    onDelete: async (item: FileKnowledge) => {
      await apiClient.knowledge.deleteFile(item.workspace_id, item.id);
      removeItem(item.id);
      toast.success(`File "${item.name}" deleted successfully`);
    },
    getCompactMetadata: (item: FileKnowledge) => (
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          {getFileExtension(item.name, item.type)} • {formatFileSize(item.size)}
        </span>
        {item.status === "completed" && item.word_count && (
          <span>{formatCountLocale(item.word_count)} words</span>
        )}
        <span>Uploaded {formatDate(item.created_at)}</span>
      </div>
    ),
  };

  return (
    <BaseKnowledgeListItem
      item={item}
      config={listConfig}
      onSelect={onSelect}
      isSelected={isSelected}
    />
  );
}
