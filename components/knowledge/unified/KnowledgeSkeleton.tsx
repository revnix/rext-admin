"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { KnowledgeListViewMode } from "@/types/knowledge";
import { GRID_SKELETON_KEYS, LIST_SKELETON_KEYS } from "./types";

interface KnowledgeSkeletonProps {
  viewMode: KnowledgeListViewMode;
}

/**
 * Loading skeleton for knowledge list.
 * Displays placeholder cards/rows based on the current view mode.
 */
export function KnowledgeSkeleton({ viewMode }: KnowledgeSkeletonProps) {
  if (viewMode === "grid") {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {GRID_SKELETON_KEYS.map((key) => (
          <Card key={key}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 rounded-full bg-muted" />
                <div className="h-4 w-20 rounded-full bg-muted" />
              </div>
              <div className="h-5 w-3/4 rounded-md bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded-md bg-muted" />
                <div className="h-4 w-3/4 rounded-md bg-muted" />
              </div>
              <div className="flex gap-2">
                <div className="h-4 w-16 rounded-full bg-muted" />
                <div className="h-4 w-24 rounded-full bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {LIST_SKELETON_KEYS.map((key) => (
        <div key={key} className="flex flex-col gap-3 rounded-md border p-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 rounded-full bg-muted" />
            <div className="h-5 w-48 rounded-md bg-muted" />
            <div className="h-5 w-24 rounded-full bg-muted" />
          </div>
          <div className="h-4 w-full rounded-md bg-muted" />
          <div className="h-4 w-3/4 rounded-md bg-muted" />
        </div>
      ))}
    </div>
  );
}
