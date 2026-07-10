/**
 * Google Search Console / GA4 Integration Types
 *
 * Response shapes for `/api/v1/integrations/google/*` — Modules 1-4
 * (Dashboard, Content Inventory, Content Health Score, Opportunity Score).
 * Mirrors the backend's Pydantic response schemas field-for-field, including
 * nullability — a null value has specific meaning (not enough data yet,
 * not connected, never inspected) and must not be defaulted away in the UI.
 */

// ============================================================================
// CONNECTION / SETUP (prerequisite for all 4 modules)
// ============================================================================

export interface GoogleConnectionStatus {
  is_active: boolean;
  google_account_email: string | null;
  scopes: string | null;
  connected_at?: string | null;
}

export interface GoogleAuthorizationUrlResponse {
  authorization_url: string;
}

export interface GoogleSearchConsoleSite {
  siteUrl: string;
  permissionLevel: string;
}

export interface GoogleSiteMapping {
  id: string;
  site_id: string;
  gsc_site_url: string | null;
  ga4_property_id: string | null;
  is_active: boolean;
  last_synced_at: string | null;
}

export interface GoogleSiteMappingRequest {
  gsc_site_url?: string | null;
  ga4_property_id?: string | null;
}

// ============================================================================
// MODULE 1 — DASHBOARD
// ============================================================================

export interface TrendPoint {
  date: string;
  value: number | null;
}

export interface DashboardKPIs {
  total_articles: number;
  indexed_pages: number;
  organic_clicks: number;
  organic_impressions: number;
  average_position: number | null;
  ctr: number; // 0-1 ratio
  organic_traffic_trend: number | null; // % change vs prior window
  total_opportunity_score: number; // 0-100
  articles_requiring_update: number;
  average_health_score: number | null; // 0-100
}

export interface DashboardCharts {
  click_trend: TrendPoint[];
  impression_trend: TrendPoint[];
  position_trend: TrendPoint[];
  ctr_trend: TrendPoint[];
}

export interface GoogleDashboardResponse {
  workspace_id: string;
  kpis: DashboardKPIs;
  charts: DashboardCharts;
}

// ============================================================================
// MODULE 2 — CONTENT INVENTORY
// ============================================================================

export type ContentTrend =
  | "growing"
  | "declining"
  | "stable"
  | "new"
  | "no_data";

export const CONTENT_INVENTORY_FILTERS = [
  "published",
  "growing",
  "declining",
  "needs_update",
  "high_opportunity",
  "low_ctr",
  "not_indexed",
  "cannibalized",
] as const;
export type ContentInventoryFilter = (typeof CONTENT_INVENTORY_FILTERS)[number];

export type ContentInventorySortField =
  | "title"
  | "status"
  | "opportunity_score"
  | "organic_clicks"
  | "organic_impressions"
  | "ctr"
  | "average_position"
  | "last_updated";

export interface ContentInventoryItem {
  content_id: string;
  url: string | null;
  title: string;
  primary_keyword: string | null;
  status: string;
  health_score: number | null; // Module 3
  opportunity_score: number | null;
  organic_clicks: number | null;
  organic_impressions: number | null;
  ctr: number | null; // 0-1 ratio
  average_position: number | null;
  last_updated: string | null;
  ai_recommendation: string | null; // always null until Module 5 ships
  trend: ContentTrend | null;
  needs_update: boolean;
  low_ctr: boolean;
  is_indexed: boolean | null; // null = not inspected yet, treat as "unknown"
  is_cannibalized: boolean;
}

export interface ContentInventoryResponse {
  workspace_id: string;
  items: ContentInventoryItem[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================================================
// MODULE 3 — CONTENT HEALTH SCORE
// ============================================================================

export interface ContentHealthScoreComponents {
  technical_seo: number | null;
  seo_optimization: number | null;
  content_quality: number | null;
  topical_coverage: number | null;
  freshness: number | null;
  user_engagement: number | null;
}

export interface ContentHealthScoreResponse {
  content_id: string;
  overall: number | null; // null = not enough data yet
  components: ContentHealthScoreComponents;
  capped_due_to_indexing: boolean;
}

// ============================================================================
// MODULE 4 — OPPORTUNITY SCORE
// ============================================================================

export type OpportunityPriorityLevel = "Critical" | "High" | "Medium" | "Low";

export interface OpportunityScoreResponse {
  content_id: string;
  score: number | null;
  estimated_traffic_gain: number | null; // clicks/month, modeled
  estimated_ranking_gain: number | null; // positions
  priority_level: OpportunityPriorityLevel | null;
  estimated_time_to_improve: string | null; // heuristic bucket label
  target_query: string | null;
  target_query_impressions: number | null;
  current_position: number | null;
  target_position: number | null;
  current_impressions: number | null;
  capped_due_to_indexing: boolean;
}

export interface OpportunityRankedItem {
  content_id: string;
  title: string;
  url: string | null;
  score: number | null;
  estimated_traffic_gain: number | null;
  estimated_ranking_gain: number | null;
  priority_level: OpportunityPriorityLevel | null;
  estimated_time_to_improve: string | null;
  target_query: string | null;
  target_query_impressions: number | null;
  current_position: number | null;
  target_position: number | null;
  current_impressions: number | null;
  capped_due_to_indexing: boolean;
}

export interface OpportunityRankedListResponse {
  workspace_id: string;
  items: OpportunityRankedItem[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================================================
// CONTENT PERFORMANCE — daily GSC/GA4 metrics backing the article Overview
// and Keyword Analytics (ranking history) sections.
// ============================================================================

export interface ContentSearchConsoleDailyMetric {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number; // 0-1 ratio
  position: number;
}

export interface ContentAnalyticsDailyMetric {
  date: string;
  sessions?: number;
  active_users?: number;
  screen_page_views?: number;
  engagement_rate?: number;
  average_session_duration?: number;
  bounce_rate?: number;
}

export interface ContentPerformanceResponse {
  content_id: string;
  search_console: ContentSearchConsoleDailyMetric[];
  analytics: ContentAnalyticsDailyMetric[];
}

// ============================================================================
// MODULE 5 — AI DIAGNOSIS (ranking diagnosis)
// ============================================================================

export type RankingDiagnosisClassification =
  | "ranking_drop"
  | "ctr_collapse"
  | "visibility_drop"
  | "improving"
  | "stable"
  | "no_data";

export interface RankingSignalItem {
  key: string;
  label: string;
  detail: string;
}

export interface RankingDiagnosisResponse {
  content_id: string;
  classification: RankingDiagnosisClassification;
  window_days: number;

  position_current: number | null;
  position_previous: number | null;
  position_delta: number | null;
  clicks_current: number;
  clicks_previous: number;
  clicks_delta_pct: number | null;
  impressions_current: number;
  impressions_previous: number;
  impressions_delta_pct: number | null;

  top_query: string | null;
  top_query_position: number | null;

  signals: RankingSignalItem[];
  summary: string;
  reasons: string[];

  ai_generated: boolean;
  ai_unavailable_reason: string | null;
}
