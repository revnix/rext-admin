"use client";

import { Activity } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Workspace } from "@/types/workspace";

interface RecentActivityCardProps {
  workspace: Workspace | null;
}

export function RecentActivityCard({ workspace }: RecentActivityCardProps) {
  // Placeholder implementation - will be enhanced in future with real activity data
  // workspace parameter will be used when real activity API is available
  const placeholderActivities = [
    {
      id: 1,
      title: "Activity tracking coming soon",
      description: "Recent workspace activities will appear here",
      timestamp: "Just now",
    },
    {
      id: 2,
      title: "Stay tuned",
      description: "Track team activity, content updates, and more",
      timestamp: "Soon",
    },
    {
      id: 3,
      title: "Real-time updates",
      description: "Get notified of important workspace changes",
      timestamp: "Soon",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates in your workspace</CardDescription>
          </div>
          <Activity className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {placeholderActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-3 rounded-lg border border-dashed"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {activity.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
              </div>
              <div className="text-xs text-muted-foreground shrink-0">
                {activity.timestamp}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Activity tracking will be available in a future update
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
