// Common data table types for the application

import type { ReactNode } from "react";
import type { BaseTableRow } from "./shared";

export interface ContentData extends BaseTableRow {
  title: string;
  type: string;
  contentType: string;
  status: string;
  publishedTo: string;
  publishDate: string | null;
  scheduledDate: string | null;
  flowName: string;
  flowId: string;
  wordCount: number;
  readTime: string;
  engagement: {
    views: number;
    likes: number;
    shares: number;
  };
  seoScore: number;
  author: string;
  humanReviewer: string;
  keywords: string[];
  platforms: string[];
  lastModified: string;
  created: string;
  content: string;
}

export interface TopicData extends BaseTableRow {
  name: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  source: string;
  tags: string[];
  created: string;
  lastModified: string;
  assignee: string;
  estimatedEffort: string;
  // Additional fields for enhanced topic tracking
  score?: number;
  ranking?: string;
  updated?: string;
  author?: string;
  contentType?: string;
  // Enhanced fields for full topic display
  audience_fit?: string[];
  channel_fit?: string[];
  scores?: {
    relevance: number;
    seo_potential: number;
    trend_level: number;
    uniqueness: number;
    reader_interest: number;
    actionable_potential: number;
    brand_alignment: number;
    controversy: number;
  };
  angle?: string;
  why_it_works?: string;
  approved?: boolean;
}

export interface ModelData extends BaseTableRow {
  name: string;
  provider: string;
  type: string;
  status: string;
  version: string;
  lastUsed: string;
  totalUsage: number;
  avgResponseTime: string;
  costPerUse: string;
  capabilities: string[];
  description: string;
}

export interface MemoryData extends BaseTableRow {
  title: string;
  content: string;
  type: string;
  source: string;
  created: string;
  lastAccessed: string;
  accessCount: number;
  tags: string[];
  importance: string;
  category: string;
}

export interface UserData extends BaseTableRow {
  name: string;
  email: string;
  role: string;
  status: string;
  joinDate: string;
  lastLogin: string;
  totalLogins: number;
  permissions: string[];
}

/**
 * Notification configuration based on platform type
 */
export interface NotificationConfiguration {
  // Email configuration
  email?: {
    recipients: string[];
    subject?: string;
    template?: string;
  };
  // Slack configuration
  slack?: {
    channel: string;
    webhook?: string;
    mentions?: string[];
  };
  // SMS configuration
  sms?: {
    phoneNumbers: string[];
    provider?: string;
  };
  // Webhook configuration
  webhook?: {
    url: string;
    method: "GET" | "POST" | "PUT";
    headers?: Record<string, string>;
    payload?: Record<string, unknown>;
  };
  // Discord configuration
  discord?: {
    webhookUrl: string;
    username?: string;
    avatarUrl?: string;
  };
  // Common settings
  retryCount?: number;
  timeout?: number;
  enabled?: boolean;
}

export interface NotificationData extends BaseTableRow {
  name: string;
  type: string;
  status: string;
  lastNotification: string;
  totalNotifications: number;
  successRate: string;
  description: string;
  platform: string;
  configuration: NotificationConfiguration;
}

export interface PromptTemplateData extends BaseTableRow {
  name: string;
  category: string;
  description: string;
  variables: string[];
  usage: number;
  lastUsed: string;
  created: string;
  author: string;
  version: string;
  content: string;
}

export interface SocialAccountData extends BaseTableRow {
  platform: string;
  account: string;
  status: string;
  connected: string;
  lastPost: string;
  followers: string;
  engagement: string;
  posts: number;
  reach: string;
}

export interface RuleData extends BaseTableRow {
  name: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  trigger: string;
  action: string;
  lastTriggered: string;
  timesTriggered: number;
  successRate: string;
  created: string;
  author: string;
}

// Row action types for data table
export interface RowAction<T extends Record<string, unknown> = BaseTableRow> {
  label: string;
  icon?: React.ReactNode;
  onClick?: (row: T) => void;
  href?: string | ((row: T) => string);
  variant?: "default" | "destructive";
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationDescription?: string;
  tooltip?: string;
  disabled?: boolean | ((row: T) => boolean);
  showLabel?: boolean;
  primary?: boolean;
}

// Legacy alias for backwards compatibility
export interface TableAction<T extends Record<string, unknown> = BaseTableRow>
  extends RowAction<T> {}

// Enhanced column interface with custom cell rendering support
export interface Column<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  key: string;
  header: string;
  width?: string;
  cell?: (value: unknown, row: T) => ReactNode;
  searchable?: boolean;
  filterable?: boolean;
  filterType?: "text" | "number" | "date" | "boolean" | "array" | "select";
  filterOptions?: string[]; // For select type filters
}

// Filter operator types
export type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "greater_than_equal"
  | "less_than"
  | "less_than_equal"
  | "is_empty"
  | "is_not_empty"
  | "array_contains"
  | "array_not_contains";

// Filter value types
export type FilterValue = string | number | boolean | Date | string[] | null;

// Individual column filter
export interface ColumnFilter {
  columnKey: string;
  operator: FilterOperator;
  value: FilterValue;
  label: string; // Human readable filter description
}

// Filter state management
export interface FilterState {
  activeFilters: ColumnFilter[];
  isFiltering: boolean;
}

// Table-level action types for standardized action system
export interface TableLevelAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  tooltip?: string;
  href?: string; // For link actions
  shortcut?: string; // Keyboard shortcut display
}

// Table action group for dropdown menus
export interface TableActionGroup {
  id: string;
  label: string;
  icon?: ReactNode;
  actions: TableLevelAction[];
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  disabled?: boolean;
}

// Export configuration options
export interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
  delimiter?: string;
  columns?: string[]; // Specify which columns to export
}
