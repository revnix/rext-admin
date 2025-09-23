"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Edit3,
  Eye,
  Globe,
  Loader2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ContentStatus } from "@/types/content";
import { CONTENT_STATUS_CONFIG } from "@/types/content";

interface ContentStatusBadgeProps {
  status: ContentStatus;
  showIcon?: boolean;
  className?: string;
}

const ICON_COMPONENTS = {
  Edit3,
  Loader2,
  CheckCircle,
  AlertCircle,
  Globe,
  Calendar,
  Eye,
  X,
} as const;

export function ContentStatusBadge({
  status,
  showIcon = true,
  className,
}: ContentStatusBadgeProps) {
  const config = CONTENT_STATUS_CONFIG[status];

  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    );
  }

  const IconComponent =
    ICON_COMPONENTS[config.icon as keyof typeof ICON_COMPONENTS];

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        config.color,
        config.bgColor,
        config.borderColor,
        className,
      )}
      title={config.description}
    >
      {showIcon && IconComponent && (
        <IconComponent
          className={cn(
            "h-3 w-3 mr-1",
            status === "generating" && "animate-spin",
          )}
        />
      )}
      {config.label}
    </Badge>
  );
}
