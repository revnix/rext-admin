"use client";

import { useQuery } from "@tanstack/react-query";
import {
  googleContentInventoryQueries,
  googleContentPerformanceQueries,
  googleScoreQueries,
} from "@/lib/query-keys";
import type {
  ContentInventoryFilter,
  ContentInventorySortField,
} from "@/types/google-integration";

/** Module 2: filterable/sortable article table. */
export function useGoogleContentInventory(
  workspaceId: string,
  options?: {
    days?: number;
    page?: number;
    pageSize?: number;
    filters?: ContentInventoryFilter[];
    sortBy?: ContentInventorySortField;
    sortOrder?: "asc" | "desc";
  },
) {
  return useQuery(googleContentInventoryQueries.list(workspaceId, options));
}

/** Module 3: composite health score + 6-component breakdown for one article. */
export function useGoogleHealthScore(workspaceId: string, contentId: string) {
  return useQuery(googleScoreQueries.healthScore(workspaceId, contentId));
}

/** Module 4: opportunity score + modeled outputs for one article. */
export function useGoogleOpportunityScore(
  workspaceId: string,
  contentId: string,
  days = 28,
) {
  return useQuery(
    googleScoreQueries.opportunityScore(workspaceId, contentId, days),
  );
}

/** Module 4: published articles ranked by opportunity score. */
export function useGoogleRankedOpportunities(
  workspaceId: string,
  options?: { days?: number; page?: number; pageSize?: number },
) {
  return useQuery(googleScoreQueries.rankedOpportunities(workspaceId, options));
}

/**
 * Daily GSC/GA4 metrics for one article — backs the Overview section
 * (organic traffic/CTR/impressions/position trend) and the Keyword
 * Analytics section's ranking history on the article detail page.
 */
export function useGoogleContentPerformance(
  workspaceId: string,
  contentId: string,
  days = 90,
) {
  return useQuery(
    googleContentPerformanceQueries.detail(workspaceId, contentId, days),
  );
}
