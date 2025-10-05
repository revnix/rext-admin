import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Base interface for all knowledge items
 */
export interface BaseKnowledgeItem {
  id: string;
  workspace_id: string;
  created_at: string;
  updated_at?: string;
  char_count?: number;
  word_count?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Status configuration for displaying status badges
 */
export interface StatusConfig {
  icon: LucideIcon;
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  color: string;
  animate?: boolean;
}

/**
 * Configuration for card actions (dropdown menu items)
 */
export interface CardAction {
  icon: LucideIcon;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
  requiresConfirmation?: boolean;
  confirmationConfig?: {
    title: string;
    description: string;
    confirmText: string;
  };
}

/**
 * Configuration for rendering card metadata sections
 */
export interface MetadataSection {
  id: string;
  content: ReactNode;
  condition?: boolean; // Only render if true
}

/**
 * Base props for knowledge card components
 */
export interface BaseKnowledgeCardProps<T extends BaseKnowledgeItem> {
  item: T;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

/**
 * Configuration for customizing BaseKnowledgeCard behavior
 */
export interface KnowledgeCardConfig<T extends BaseKnowledgeItem> {
  // Primary icon for the card
  primaryIcon: LucideIcon;

  // Main title to display
  getTitle: (item: T) => string;

  // Description/subtitle to display
  getDescription: (item: T) => ReactNode;

  // Status configuration (if applicable)
  getStatusConfig?: (item: T) => StatusConfig | null;

  // Actions for dropdown menu
  getActions: (item: T) => CardAction[];

  // Content sections to display in card body
  getMetadataSections: (item: T) => MetadataSection[];

  // Delete handler
  onDelete: (item: T) => Promise<void>;

  // Optional: Custom class names
  className?: string;

  // Optional: Format helpers
  formatCount?: (count?: number) => string;
  formatDate?: (date: string) => string;
}

/**
 * Configuration for list item variant
 */
export interface KnowledgeListItemConfig<T extends BaseKnowledgeItem>
  extends KnowledgeCardConfig<T> {
  // Additional inline actions for list view
  getInlineActions?: (item: T) => CardAction[];

  // Compact metadata for list view
  getCompactMetadata?: (item: T) => ReactNode;
}
