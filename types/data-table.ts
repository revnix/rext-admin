// Common data table types for the application

export interface BaseTableRow extends Record<string, unknown> {
  id: string;
}

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

export interface NotificationData extends BaseTableRow {
  name: string;
  type: string;
  status: string;
  lastNotification: string;
  totalNotifications: number;
  successRate: string;
  description: string;
  platform: string;
  configuration: Record<string, unknown>;
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

// Action types for data table
export interface TableAction<T extends Record<string, unknown> = BaseTableRow> {
  label: string;
  icon: React.ReactNode;
  onClick: (row: T) => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}
