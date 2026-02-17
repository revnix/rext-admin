"use client";

import {
  FileText,
  Globe,
  Loader2,
  AlertCircle,
  CheckCircle,
  Calendar,
  Edit3,
  Eye,
  Copy,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BaseKnowledgeCard } from "@/components/knowledge/shared/BaseKnowledgeCard";
import type { ContentItem, ContentStatus } from "@/types/content";
import type {
  KnowledgeCardConfig,
  StatusConfig,
  CardAction,
  MetadataSection,
} from "@/components/knowledge/shared/types";
import { workspaceRoutes } from "@/lib/routes";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { numberFormat } from "@/lib/formatters/number-formatters";

interface ContentCardProps {
  item: ContentItem;
  workspaceSlug: string;
  onDelete?: (id: string) => Promise<void>;
}

const statusConfig: Record<ContentStatus, StatusConfig> = {
  draft: {
    icon: Edit3,
    label: "Draft",
    variant: "secondary",
    color: "text-slate-500",
  },
  generating: {
    icon: Loader2,
    label: "Generating",
    variant: "default",
    color: "text-blue-500",
    animate: true,
  },
  generated: {
    icon: CheckCircle,
    label: "Generated",
    variant: "default",
    color: "text-green-500",
  },
  failed: {
    icon: AlertCircle,
    label: "Failed",
    variant: "destructive",
    color: "text-red-500",
  },
  published: {
    icon: Globe,
    label: "Published",
    variant: "default",
    color: "text-green-500",
  },
  scheduled: {
    icon: Calendar,
    label: "Scheduled",
    variant: "outline",
    color: "text-purple-500",
  },
  review: {
    icon: Eye,
    label: "Review",
    variant: "secondary",
    color: "text-orange-500",
  },
  cancelled: {
    icon: AlertCircle,
    label: "Cancelled",
    variant: "outline",
    color: "text-slate-400",
  },
};

export function ContentCard({
  item,
  workspaceSlug,
  onDelete,
}: ContentCardProps) {
  const router = useRouter();

  const handleSelect = () => {
    router.push(workspaceRoutes.contentDetail(workspaceSlug, item.id));
  };

  const config: KnowledgeCardConfig<ContentItem> = {
    primaryIcon: FileText,
    getTitle: (item: ContentItem) => item.title,
    getDescription: (item: ContentItem) => (
      <span className="text-xs text-muted-foreground line-clamp-1">
        {item.content_metadata?.content_type || "Article"} • Markdown
      </span>
    ),
    getStatusConfig: (item: ContentItem) => statusConfig[item.status] || null,
    getActions: (item: ContentItem): CardAction[] => [
      {
        icon: Eye,
        label: "View",
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          router.push(workspaceRoutes.contentDetail(workspaceSlug, item.id));
        },
      },
      {
        icon: Copy,
        label: "Copy",
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          toast.info("Copy functionality not implemented yet");
        },
      },
      {
        icon: Trash2,
        label: "Delete",
        variant: "destructive",
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
        },
        requiresConfirmation: true,
        confirmationConfig: {
          title: "Delete Content",
          description:
            "Are you sure you want to delete this content? This action cannot be undone.",
          confirmText: "Delete",
        },
      },
    ],
    getMetadataSections: (item: ContentItem): MetadataSection[] => [
      {
        id: "stats",
        condition: !!(
          item.content_metadata?.content_word_count ||
          item.seo_data?.content_seo_score
        ),
        content: (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {item.content_metadata?.content_word_count && (
              <span>
                {numberFormat.compact(item.content_metadata.content_word_count)}{" "}
                words
              </span>
            )}
            {item.seo_data?.content_seo_score !== undefined && (
              <span>SEO: {item.seo_data.content_seo_score}/100</span>
            )}
          </div>
        ),
      },
      {
        id: "platform",
        condition: !!item.content_metadata?.target_platform,
        content: (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" />
            <span>Target: {item.content_metadata?.target_platform}</span>
          </div>
        ),
      },
      {
        id: "timestamps",
        content: (
          <div className="text-xs text-muted-foreground mt-2">
            Created {dateFormat.short(item.created_at)}
          </div>
        ),
      },
    ],
    onDelete: async (item: ContentItem) => {
      if (onDelete) {
        await onDelete(item.id);
      }
    },
    className: "cursor-pointer",
  };

  return (
    <BaseKnowledgeCard item={item} config={config} onSelect={handleSelect} />
  );
}
