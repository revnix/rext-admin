"use client";

import { Building2, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { OnboardingProgress } from "@/components/onboarding-progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthSession } from "@/hooks/use-auth-session";
import { analytics } from "@/lib/analytics";
import { useWorkspaceStore } from "@/stores/workspace";

/**
 * Dashboard Empty State Component
 *
 * Shown to new users who haven't created any workspaces yet.
 * Provides welcoming onboarding experience with clear value proposition.
 *
 * Design follows UX best practices:
 * - 2 parts instruction, 1 part delight
 * - Clear call-to-action
 * - Value proposition with benefits
 * - Professional but friendly tone
 * - Generous spacing and visual hierarchy
 *
 * Features:
 * - Analytics tracking for impressions and CTA clicks
 * - Personalized welcome message with user's name
 */
export function DashboardEmptyState() {
  const { user } = useAuthSession();
  const userName = user?.name?.split(" ")[0] || null; // Get first name only
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);

  // Track empty state view on mount
  useEffect(() => {
    analytics.track("onboarding_empty_dashboard_view", {
      user_id: user?.id,
      has_name: !!userName,
    });
  }, [user?.id, userName]);

  return (
    <div className="flex items-center justify-center">
      <div className="w-full px-4">
        <Card>
          <CardHeader className="text-center space-y-4 pb-6">
            {/* Hero Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-10 w-10 text-primary-foreground" />
                </div>
                <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold">
                {userName ? `Welcome, ${userName}!` : "Welcome to Rext AI!"}
              </CardTitle>
              <CardDescription className="text-base">
                Let's create your first workspace to get started with AI-powered
                content management
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Onboarding Progress - Pass workspace ID for workspace-specific tracking */}
            <OnboardingProgress workspaceId={currentWorkspace?.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
