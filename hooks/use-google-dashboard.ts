"use client";

import { useQuery } from "@tanstack/react-query";
import { googleDashboardQueries } from "@/lib/query-keys";

/**
 * Module 1: 9 KPIs + 4 trend charts for a workspace. Pass ``siteId`` to
 * scope the dashboard to one connected WordPress site.
 */
export function useGoogleDashboard(
  workspaceId: string,
  days = 28,
  siteId?: string,
) {
  return useQuery(googleDashboardQueries.detail(workspaceId, days, siteId));
}
