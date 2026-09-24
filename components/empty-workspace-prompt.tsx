"use client";

import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthSession } from "@/hooks/use-auth-session";
import { analytics } from "@/lib/analytics";
import { useResourceLimit } from "@/components/subscription/usage-limit-warning";

/**
 * Empty Workspace Prompt Component
 *
 * Displayed in the sidebar when no workspaces exist.
 * Provides clear guidance and CTA for creating the first workspace.
 *
 * Features:
 * - Clean, motivational design
 * - Clear value proposition
 * - Prominent CTA
 * - Follows empty state UX best practices
 * - Analytics tracking for impressions and clicks
 */
export function EmptyWorkspacePrompt() {
  const { user } = useAuthSession();
  const { isLimitReached, isLoading: isLimitLoading } =
    useResourceLimit("workspaces");

  // Track sidebar empty state view on mount
  useEffect(() => {
    analytics.track("onboarding_empty_sidebar_view", {
      user_id: user?.id,
    });
  }, [user?.id]);

  // Track CTA click
  const handleCTAClick = () => {
    analytics.track("onboarding_cta_click", {
      source: "sidebar",
      destination: "/w/create",
      user_id: user?.id,
    });
  };

  return (
    <div className="px-2 py-3">
      <Card className="border-dashed bg-muted/30">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                No Workspace
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                Get started now
              </p>
            </div>
          </div>
          <Button
            asChild
            className="w-full h-8"
            size="sm"
            disabled={isLimitReached || isLimitLoading}
            onClick={
              isLimitReached || isLimitLoading ? undefined : handleCTAClick
            }
          >
            <Link
              href={isLimitReached || isLimitLoading ? "#" : "/w/create"}
              onClick={(event) => {
                if (isLimitReached || isLimitLoading) {
                  event.preventDefault();
                }
              }}
            >
              <Plus className="h-3 w-3 mr-1.5" />
              <span className="text-xs">
                {isLimitReached
                  ? "Workspace limit reached"
                  : isLimitLoading
                    ? "Checking plan..."
                    : "Create Workspace"}
              </span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
