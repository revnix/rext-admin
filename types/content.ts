// Content management types

export type ContentStatus =
  | "draft"
  | "generating"
  | "generated"
  | "failed"
  | "published"
  | "scheduled"
  | "review"
  | "cancelled";

export interface ContentStatusInfo {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  description: string;
}

export const CONTENT_STATUS_CONFIG: Record<ContentStatus, ContentStatusInfo> = {
  draft: {
    label: "Draft",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-200",
    icon: "Edit3",
    description: "Content is being created or edited",
  },
  generating: {
    label: "Generating",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-200",
    icon: "Loader2",
    description: "AI is generating the content",
  },
  generated: {
    label: "Generated",
    color: "text-green-700",
    bgColor: "bg-green-100",
    borderColor: "border-green-200",
    icon: "CheckCircle",
    description: "Content has been generated and is ready for review",
  },
  failed: {
    label: "Failed",
    color: "text-red-700",
    bgColor: "bg-red-100",
    borderColor: "border-red-200",
    icon: "AlertCircle",
    description: "Content generation failed",
  },
  published: {
    label: "Published",
    color: "text-green-700",
    bgColor: "bg-green-100",
    borderColor: "border-green-200",
    icon: "Globe",
    description: "Content is live and published",
  },
  scheduled: {
    label: "Scheduled",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-200",
    icon: "Calendar",
    description: "Content is scheduled for future publication",
  },
  review: {
    label: "Review",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-200",
    icon: "Eye",
    description: "Content is under human review",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-200",
    icon: "X",
    description: "Content generation was cancelled",
  },
};

export const STATUS_FILTER_OPTIONS = Object.keys(CONTENT_STATUS_CONFIG).map(
  (status) => ({
    value: status,
    label: CONTENT_STATUS_CONFIG[status as ContentStatus].label,
  }),
);
