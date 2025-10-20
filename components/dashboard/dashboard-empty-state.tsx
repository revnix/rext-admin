"use client";

import { Building2, CheckCircle2, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { OnboardingProgress } from "@/components/onboarding-progress";
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

  const benefits = [
    "Generate AI-powered content tailored to your brand",
    "Organize topics and manage content workflows",
    "Collaborate with team members in real-time",
    "Track performance with analytics and insights",
  ];

  // Track empty state view on mount
  useEffect(() => {
    analytics.track("onboarding_empty_dashboard_view", {
      user_id: user?.id,
      has_name: !!userName,
    });
  }, [user?.id, userName]);

  // Track CTA click
  const handleCTAClick = () => {
    analytics.track("onboarding_cta_click", {
      source: "dashboard",
      destination: "/w/create",
      user_id: user?.id,
    });
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-2xl w-full px-4">
        <Card className="border-none shadow-lg">
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
                {userName ? `Welcome, ${userName}!` : "Welcome to Wrext!"}
              </CardTitle>
              <CardDescription className="text-base">
                Let's create your first workspace to get started with AI-powered
                content management
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Onboarding Progress */}
            <OnboardingProgress />

            {/* Benefits List */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground text-center">
                With your workspace, you'll be able to:
              </p>
              <div className="grid gap-3">
                {benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Call to Action */}
            <div className="space-y-3 pt-2">
              <Button
                asChild
                size="lg"
                className="w-full text-base h-12"
                onClick={handleCTAClick}
              >
                <Link href="/w/create">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Workspace
                </Link>
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Setting up your workspace takes less than 2 minutes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
