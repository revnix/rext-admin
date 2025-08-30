// Common data table types for the application

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

export interface FlowData extends BaseTableRow {
  name: string;
  description: string;
  status: string;
  trigger: string;
  lastRun: string;
  totalRuns: number;
  successRate: string;
  avgRunTime: string;
  category: string;
  created: string;
  lastModified: string;
}

export interface IdeaData extends BaseTableRow {
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
  // Additional fields for enhanced idea tracking
  score?: number;
  ranking?: string;
  updated?: string;
  author?: string;
  contentType?: string;
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
  onClick: (row: T) => void;
  variant?: "default" | "destructive";
}

// Legacy alias for backwards compatibility
export interface TableAction<T extends Record<string, unknown> = BaseTableRow>
  extends RowAction<T> {}
