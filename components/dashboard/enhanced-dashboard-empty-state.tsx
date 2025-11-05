"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Mail, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { PendingInvitationsCard } from "@/components/dashboard/pending-invitations-card";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/hooks/use-auth-session";
import { analytics } from "@/lib/analytics";
import { apiClient } from "@/lib/api-client";

/**
 * Enhanced Dashboard Empty State Component
 *
 * Intelligently handles different scenarios:
 * 1. No workspaces + no invitations → Create workspace CTA
 * 2. No workspaces + pending invitations → Accept invitations CTA
 * 3. Has workspaces but viewing dashboard → Onboarding progress
 *
 * Features:
 * - Context-aware messaging
 * - Pending invitations integration
 * - Analytics tracking
 * - Personalized welcome
 * - Clear call-to-actions
 */
export function EnhancedDashboardEmptyState() {
  const { user } = useAuthSession();
  const userName = user?.name?.split(" ")[0] || null;

  // Fetch pending invitations
  const { data: invitationsData, isLoading: isLoadingInvitations } = useQuery({
    queryKey: ["invitations", "pending"],
    queryFn: () => apiClient.invitations.pending(),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Fetch user's workspaces
  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ["workspaces", "user"],
    queryFn: () => apiClient.workspaces.list(),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const hasPendingInvitations = invitationsData && invitationsData.count > 0;
  const hasWorkspaces = workspacesData && workspacesData.workspaces.length > 0;

  // Track empty state view
  useEffect(() => {
    analytics.track("dashboard_empty_state_view", {
      user_id: user?.id,
      has_pending_invitations: hasPendingInvitations,
      has_workspaces: hasWorkspaces,
      invitation_count: invitationsData?.count || 0,
    });
  }, [user?.id, hasPendingInvitations, hasWorkspaces, invitationsData?.count]);

  // Loading state
  if (isLoadingInvitations || isLoadingWorkspaces) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-2xl px-4">
          <Card>
            <CardHeader className="space-y-4">
              <Skeleton className="h-20 w-20 rounded-2xl mx-auto" />
              <Skeleton className="h-8 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-full mx-auto" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Scenario 1: No workspaces + Pending invitations
  if (!hasWorkspaces && hasPendingInvitations) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-2xl px-4 space-y-6">
          {/* Welcome Card */}
          <Card>
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <Mail className="h-10 w-10 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold">
                  {userName ? `Welcome, ${userName}!` : "Welcome to Wrext!"}
                </CardTitle>
                <CardDescription className="text-base">
                  You've been invited to join{" "}
                  {invitationsData.count === 1
                    ? "a workspace"
                    : `${invitationsData.count} workspaces`}
                  . Accept your invitation{invitationsData.count > 1 ? "s" : ""}{" "}
                  to get started!
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          {/* Pending Invitations */}
          <PendingInvitationsCard />

          {/* Alternative: Create Own Workspace */}
          <Card className="border-dashed bg-muted/30">
            <CardContent className="p-6 text-center space-y-3">
              <Building2 className="h-8 w-8 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium mb-1">
                  Want to create your own workspace?
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  You can also start fresh with a new workspace
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/workspaces/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workspace
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Scenario 2: No workspaces + No invitations
  if (!hasWorkspaces && !hasPendingInvitations) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-3xl px-4">
          <Card>
            <CardHeader className="text-center space-y-4 pb-6">
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

              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold">
                  {userName ? `Welcome, ${userName}!` : "Welcome to Wrext!"}
                </CardTitle>
                <CardDescription className="text-base">
                  Let's create your first workspace to get started with
                  AI-powered content management
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <OnboardingProgress />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Scenario 3: Has workspaces (shouldn't normally show this state)
  // This is a fallback - user should be redirected to a workspace
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-2xl px-4">
        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl">Select a Workspace</CardTitle>
              <CardDescription>
                Choose a workspace from the sidebar to get started
              </CardDescription>
            </div>
          </CardHeader>
          {hasPendingInvitations && (
            <CardContent>
              <PendingInvitationsCard />
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
