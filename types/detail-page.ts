import type { ReactNode } from "react";

// Core detail page section types
export interface DetailSection {
  id: string;
  title: string;
  icon?: ReactNode;
  priority: "high" | "medium" | "low";
  gradient?: "blue" | "purple" | "green" | "amber" | "red" | "gray";
  actions?: DetailSectionAction[];
}

export interface DetailSectionAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "secondary" | "outline" | "destructive";
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
}

// Card variant system
export interface DetailCardVariant {
  variant: "default" | "highlight" | "accent" | "warning" | "success" | "info";
  size?: "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
}

// Info section display patterns
export interface InfoItem {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  copyable?: boolean;
  href?: string;
  description?: string;
}

export interface InfoSectionProps {
  title?: string;
  items: InfoItem[];
  columns?: 1 | 2 | 3 | 4;
  variant?: "default" | "compact" | "detailed";
  showDividers?: boolean;
}

// Status badge enhancements
export interface StatusConfig {
  label: string;
  variant:
    | "default"
    | "secondary"
    | "outline"
    | "destructive"
    | "success"
    | "warning";
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "gray";
  icon?: ReactNode;
  pulse?: boolean;
}

// Layout grid system
export interface DetailLayoutConfig {
  sidebar: "none" | "sm" | "md" | "lg";
  content: "narrow" | "normal" | "wide" | "full";
  spacing: "compact" | "normal" | "relaxed";
  responsive: boolean;
}

// Section component props
export interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: DetailSectionAction[];
  badge?: {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  };
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  variant?: "default" | "compact" | "spacious";
  level?: 1 | 2 | 3 | 4;
  className?: string;
}

export interface ActionSectionProps {
  actions?: DetailSectionAction[];
  layout?: "horizontal" | "vertical" | "grid";
  align?: "start" | "center" | "end" | "between" | "around";
  gap?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

// Design tokens
export interface DetailPageTokens {
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  gradients: {
    blue: string;
    purple: string;
    green: string;
    amber: string;
    red: string;
    gray: string;
  };
}

// Enhanced metadata item for DetailPageWrapper
export interface DetailMetadataItem {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  copyable?: boolean;
  href?: string;
  description?: string;
  priority?: "high" | "medium" | "low";
}

// ============================================================================
// DETAIL PAGE WRAPPER TYPES
// ============================================================================

/**
 * Breadcrumb navigation item
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Navigation item for prev/next controls
 */
export interface NavigationItem {
  id: string;
  title: string;
  href: string;
}

/**
 * Type aliases for consistency
 */
export type MetadataItem = DetailMetadataItem;
export type ActionButton = DetailSectionAction;

/**
 * Score card configuration for sidebar
 */
export interface ScoreCardConfig {
  /** Overall score value (0-100) */
  score: number;
  /** Title of the score card */
  title: string;
  /** Description/subtitle */
  description?: string;
  /** Icon for the score */
  icon?: ReactNode;
  /** Additional content below the score */
  content?: ReactNode;
  /** Progress bar color variant */
  variant?: "default" | "success" | "warning" | "destructive";
}

/**
 * Stats item for sidebar stats card
 */
export interface StatsItem {
  /** Label for the stat */
  label: string;
  /** Value to display */
  value: ReactNode;
  /** Optional icon */
  icon?: ReactNode;
  /** Whether the value should be highlighted */
  highlight?: boolean;
}

/**
 * Stats card configuration for sidebar
 */
export interface StatsCardConfig {
  /** Title of the stats card */
  title: string;
  /** Array of stats to display */
  items: StatsItem[];
  /** Optional description */
  description?: string;
}

/**
 * Info card configuration using existing InfoSection component
 */
export interface InfoCardConfig {
  /** Title of the info card */
  title: string;
  /** Info items using existing InfoItem type */
  items: InfoItem[];
  /** Display variant */
  variant?: "default" | "compact" | "detailed";
  /** Number of columns */
  columns?: 1 | 2 | 3 | 4;
  /** Optional description */
  description?: string;
}

/**
 * Custom card configuration for flexible content
 */
export interface CustomCardConfig {
  /** Unique identifier for the card */
  id: string;
  /** Custom content to render */
  content: ReactNode;
  /** Optional priority for ordering */
  priority?: number;
}

/**
 * Sidebar card types union
 */
export type SidebarCard =
  | { type: "score"; config: ScoreCardConfig }
  | { type: "stats"; config: StatsCardConfig }
  | { type: "info"; config: InfoCardConfig }
  | { type: "custom"; config: CustomCardConfig };

/**
 * Sidebar configuration
 */
export interface SidebarConfig {
  /** Array of cards to display */
  cards?: SidebarCard[];
  /** Order of built-in sections */
  order?: ("cards" | "metadata" | "quickActions")[];
  /** Hide sidebar on certain screen sizes */
  hideOn?: "mobile" | "tablet" | "never";
}

/**
 * Props for the DetailPageWrapper component
 */
export interface DetailPageWrapperProps {
  // Page metadata
  title: string;
  breadcrumbs?: BreadcrumbItem[];

  // Navigation
  backUrl?: string;
  backLabel?: string;
  prevItem?: NavigationItem;
  nextItem?: NavigationItem;

  // Content areas
  children: ReactNode; // Main content
  headerActions?: ReactNode; // Actions in the header
  quickActions?: ActionButton[]; // Quick action buttons in sidebar

  // Sidebar configuration (flexible system)
  sidebarConfig?: SidebarConfig; // New flexible sidebar system

  // Legacy props (backward compatibility)
  sidebar?: ReactNode; // Custom sidebar content (still supported)
  scoreCard?: ScoreCardConfig; // Legacy - will be converted to sidebarConfig
  statsCard?: StatsCardConfig; // Legacy - will be converted to sidebarConfig

  // Status & metadata
  status?: string;
  statusVariant?: "default" | "secondary" | "outline" | "destructive";
  metadata?: MetadataItem[];

  // Layout options (enhanced)
  layout?: "default" | "full-width" | "no-sidebar" | "narrow" | "wide";
  sidebarWidth?: "sm" | "md" | "lg";
  contentWidth?: "narrow" | "normal" | "wide" | "full";
  spacing?: "compact" | "normal" | "relaxed";
  responsive?: boolean;
  showGridLines?: boolean;

  // States
  isLoading?: boolean;
  error?: string | Error;
  loadingMessage?: string;

  // Additional styling (enhanced)
  className?: string;
  contentClassName?: string;
  sidebarClassName?: string;
  headerClassName?: string;
  containerClassName?: string;
  variant?: "default" | "highlight" | "minimal";
}

/**
 * Props for wrapper component variants
 */
export type NarrowDetailWrapperProps = Omit<
  DetailPageWrapperProps,
  "contentWidth" | "layout"
>;

export type WideDetailWrapperProps = Omit<
  DetailPageWrapperProps,
  "contentWidth" | "layout"
>;

export type FullWidthDetailWrapperProps = Omit<
  DetailPageWrapperProps,
  "layout"
>;

export type CompactDetailWrapperProps = Omit<DetailPageWrapperProps, "spacing">;

// ============================================================================
// GRID LAYOUT TYPES
// ============================================================================

/**
 * Grid configuration for detail page layouts
 */
export interface DetailGridConfig {
  /** Number of columns in the grid */
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  /** Gap between grid items */
  gap?: "sm" | "md" | "lg" | "xl";
  /** Responsive breakpoints */
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 6 | 12;
    md?: 1 | 2 | 3 | 4 | 6 | 12;
    lg?: 1 | 2 | 3 | 4 | 6 | 12;
    xl?: 1 | 2 | 3 | 4 | 6 | 12;
  };
}

/**
 * Grid item configuration
 */
export interface DetailGridItemConfig {
  /** Column span for this item */
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Responsive column spans */
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  };
  /** Starting column position */
  start?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Responsive starting positions */
  startResponsive?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  };
}

/**
 * Props for DetailGrid component
 */
export interface DetailGridProps extends DetailGridConfig {
  children: ReactNode;
  className?: string;
}

/**
 * Props for DetailGridItem component
 */
export interface DetailGridItemProps extends DetailGridItemConfig {
  children: ReactNode;
  className?: string;
}

// ============================================================================
// EXPORTED TYPES
// ============================================================================

export type DetailCardProps = DetailCardVariant & {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
  border?: boolean;
  shadow?: boolean;
};
