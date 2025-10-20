"use client";

import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthSession } from "@/hooks/use-auth-session";
import { analytics } from "@/lib/analytics";

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
    <div className="px-2 py-4">
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-center mb-2">
            <div className="relative">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <Plus className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
          </div>
          <CardTitle className="text-sm text-center">
            No Workspace Yet
          </CardTitle>
          <CardDescription className="text-xs text-center">
            Create a workspace to start managing your content, topics, and team
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <Button asChild className="w-full" size="sm" onClick={handleCTAClick}>
            <Link href="/w/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Workspace
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
