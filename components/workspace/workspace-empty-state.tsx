"use client";

import {
  BookOpen,
  FileText,
  Lightbulb,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { detectRoleCategory } from "@/lib/role-categories";
import Link from "next/link";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthSession } from "@/hooks/use-auth-session";
import { analytics } from "@/lib/analytics";
import type { Workspace } from "@/types/workspace";
import type { Route } from "next";

interface WorkspaceEmptyStateProps {
  workspace: Workspace;
  userRole?: string;
  isInvitedUser?: boolean;
}

interface SuggestedAction {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  variant?: "default" | "outline";
  show: boolean;
}

/**
 * Enhanced workspace empty state for invited users
 *
 * Shows role-specific suggestions and actions based on:
 * - User's role in the workspace
 * - Whether they were invited vs organic signup
 * - Workspace configuration
 *
 * Features:
 * - Role-aware content and CTAs
 * - Friendly, welcoming tone
 * - Clear next steps
 * - Visual appeal with icons
 * - Analytics tracking
 */
export function WorkspaceEmptyState({
  workspace,
  userRole,
  isInvitedUser = false,
}: WorkspaceEmptyStateProps) {
  const { user } = useAuthSession();
  const userName = user?.name?.split(" ")[0] || null;

  // Track empty workspace view
  useEffect(() => {
    analytics.track("workspace_empty_state_view", {
      user_id: user?.id,
      workspace_id: workspace.id,
      user_role: userRole,
      is_invited_user: isInvitedUser,
    });
  }, [user?.id, workspace.id, userRole, isInvitedUser]);

  // Get role-specific actions
  const suggestedActions = getSuggestedActions(
    workspace.slug,
    userRole || "viewer",
    isInvitedUser,
  );

  // Get welcome message based on invitation status
  const welcomeMessage = isInvitedUser
    ? `${userName ? `${userName}, you're` : "You're"} all set!`
    : `Welcome${userName ? `, ${userName}` : ""}!`;

  const description = isInvitedUser
    ? "This workspace is just getting started. Here's how you can contribute based on your role:"
    : "This workspace is empty. Let's add some content to get started!";

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="w-full max-w-4xl">
        <Card className="border-2">
          <CardHeader className="text-center space-y-4 pb-6">
            {/* Hero Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center border-2 border-primary/20">
                  {isInvitedUser ? (
                    <Sparkles className="h-12 w-12 text-primary" />
                  ) : (
                    <Plus className="h-12 w-12 text-primary" />
                  )}
                </div>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold">
                {welcomeMessage}
              </CardTitle>
              <CardDescription className="text-base max-w-2xl mx-auto">
                {description}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Suggested Actions Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suggestedActions
                .filter((action) => action.show)
                .map((action, index) => (
                  <ActionCard
                    key={action.title}
                    action={action}
                    workspaceSlug={workspace.slug}
                    index={index}
                  />
                ))}
            </div>

            {/* Help Text for Invited Users */}
            {isInvitedUser && (
              <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        New to this workspace?
                      </p>
                      <p className="text-blue-700 dark:text-blue-200">
                        Don't worry! Feel free to explore and try things out.
                        Your teammates are here to help if you have questions.
                        {detectRoleCategory(userRole || "") === "viewer" &&
                          " As a viewer, you can browse everything without making changes."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Individual action card component
 */
function ActionCard({
  action,
  workspaceSlug,
}: {
  action: SuggestedAction;
  workspaceSlug: string;
  index: number;
}) {
  const handleClick = () => {
    analytics.track("workspace_empty_state_action_click", {
      action_title: action.title,
      action_href: action.href,
      workspace_slug: workspaceSlug,
    });
  };

  return (
    <Card className="group hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer">
      <Link href={action.href as Route} onClick={handleClick}>
        <CardContent className="p-6 space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            {action.icon}
          </div>
          <div>
            <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
              {action.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {action.description}
            </p>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

/**
 * Get role-specific suggested actions
 */
function getSuggestedActions(
  workspaceSlug: string,
  userRole: string,
  isInvitedUser: boolean,
): SuggestedAction[] {
  const category = detectRoleCategory(userRole);

  switch (category) {
    case "owner":
    case "admin":
      return [
        {
          icon: <Users className="h-6 w-6" />,
          title: "Invite Team Members",
          description: "Build your team by inviting colleagues to collaborate",
          href: `/w/${workspaceSlug}/settings/members`,
          variant: "default",
          show: true,
        },
        {
          icon: <FileText className="h-6 w-6" />,
          title: "Create Content",
          description: "Start creating your first piece of content",
          href: `/w/${workspaceSlug}/content/create`,
          variant: "default",
          show: true,
        },
        {
          icon: <BookOpen className="h-6 w-6" />,
          title: "Add Knowledge",
          description:
            "Build your knowledge base with resources and documentation",
          href: `/w/${workspaceSlug}/knowledge`,
          variant: "outline",
          show: true,
        },
      ];

    case "editor":
      return [
        {
          icon: <FileText className="h-6 w-6" />,
          title: "Create Your First Content",
          description: "Start contributing by creating a piece of content",
          href: `/w/${workspaceSlug}/content/create`,
          variant: "default",
          show: true,
        },
        {
          icon: <BookOpen className="h-6 w-6" />,
          title: "Explore Knowledge Base",
          description: "Browse existing resources and documentation",
          href: `/w/${workspaceSlug}/knowledge`,
          variant: "outline",
          show: true,
        },
        {
          icon: <Users className="h-6 w-6" />,
          title: "Meet Your Team",
          description: "See who else is in the workspace",
          href: `/w/${workspaceSlug}/settings/members`,
          variant: "outline",
          show: isInvitedUser,
        },
      ];

    default:
      return [
        {
          icon: <FileText className="h-6 w-6" />,
          title: "Browse Content",
          description: "Explore content created by your team",
          href: `/w/${workspaceSlug}/content`,
          variant: "default",
          show: true,
        },
        {
          icon: <BookOpen className="h-6 w-6" />,
          title: "View Knowledge Base",
          description: "Access workspace resources and documentation",
          href: `/w/${workspaceSlug}/knowledge`,
          variant: "outline",
          show: true,
        },
        {
          icon: <Users className="h-6 w-6" />,
          title: "See Team Members",
          description: "View who's in your workspace",
          href: `/w/${workspaceSlug}/settings/members`,
          variant: "outline",
          show: isInvitedUser,
        },
      ];
  }
}
