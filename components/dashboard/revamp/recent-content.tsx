"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Inbox, Loader2 } from "lucide-react";
import type { Workspace } from "@/types/workspace";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface RecentContentProps {
  workspace: Workspace | null;
}

export function RecentContent({ workspace }: RecentContentProps) {
  const { data: rawData, isLoading } = useQuery({
    queryKey: ["recent-activities", workspace?.id],
    queryFn: () => apiClient.dashboard.getRecentActivities(workspace?.id || ""),
    enabled: !!workspace?.id,
    staleTime: 30 * 1000,
  });

  // Safely extract the activities array in case the API wraps it
  // (e.g., { data: [] } or { items: [] } or { activities: [] })
  type ActivityItem = import("@/lib/api-client/dashboard").RecentActivity;
  let recentActivities: ActivityItem[] = [];

  if (Array.isArray(rawData)) {
    recentActivities =
      rawData as import("@/lib/api-client/dashboard").RecentActivity[];
  } else if (rawData) {
    // Try to find the array in common wrapper properties
    const possibleWrappers = [
      "data",
      "items",
      "activities",
      "recent_activities",
    ];

    // Use type assertion to a more flexible record for checking
    const dataRecord = rawData as Record<string, unknown>;

    for (const key of possibleWrappers) {
      if (Array.isArray(dataRecord[key])) {
        // We found an array inside the data wrapper
        recentActivities = dataRecord[key] as ActivityItem[];
        break;
      }
    }

    // If we still don't have an array but we have data, it might be a completely unexpected format
    if (
      recentActivities.length === 0 &&
      Object.keys(dataRecord).length > 0 &&
      !possibleWrappers.some((k) => Array.isArray(dataRecord[k]))
    ) {
      // Unrecognized format, just fallback to empty array
    }
  }

  // Keep some helper for color selection

  const getStatusColor = (status: string) => {
    // Also handle "draft" lowercase
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "published":
        return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400";
      case "draft":
        return "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400";
      case "under review":
        return "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "text-slate-600 bg-slate-100";
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1 p-6 pb-4">
        <CardTitle className="text-base font-semibold text-foreground">
          Recent Activities
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Latest content changes in this workspace
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-y border-border bg-muted/60 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-6 py-2.5 min-w-60 font-medium">
                  Content Title
                </th>
                <th className="px-6 py-2.5 min-w-46 font-medium">Author</th>
                <th className="px-6 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : recentActivities.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted text-foreground">
                        <Inbox className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          No recent activity yet
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Content you create or publish will appear here.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                recentActivities.map((item, index) => (
                  <tr key={item.id || index} className="transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {item.content_title ||
                        item.name ||
                        item.title ||
                        "Untitled"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={
                              (typeof item.author !== "string"
                                ? item.author?.image
                                : undefined) ||
                              item.user?.image ||
                              item.image ||
                              ""
                            }
                          />
                          <AvatarFallback className="text-[10px] bg-muted text-foreground">
                            {typeof item.author === "string"
                              ? item.author.charAt(0).toUpperCase()
                              : item.author?.initials ||
                                item.user?.initials ||
                                "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground">
                          {typeof item.author === "string"
                            ? item.author
                            : item.author?.name ||
                              item.user?.name ||
                              item.author_name ||
                              item.creator ||
                              item.user_name ||
                              "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${getStatusColor(
                          item.content_status || item.status || "Unknown",
                        )}`}
                      >
                        {item.content_status || item.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
