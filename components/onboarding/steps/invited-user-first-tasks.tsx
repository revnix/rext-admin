"use client";

import {
  ArrowRight,
  BookOpen,
  FileText,
  MessageCircle,
  Users,
  Sparkles,
} from "lucide-react";
import { detectRoleCategory } from "@/lib/role-categories";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Route } from "next";

interface FirstTask {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  href: string;
  priority: "high" | "medium" | "low";
}

interface InvitedUserFirstTasksProps {
  workspaceSlug: string;
  roleName: string;
  onComplete: () => void;
  isLoading?: boolean;
}

/**
 * Suggested first tasks for invited users
 * Helps them get started quickly with role-appropriate actions
 */
export function InvitedUserFirstTasks({
  workspaceSlug,
  roleName,
  onComplete,
  isLoading = false,
}: InvitedUserFirstTasksProps) {
  const firstTasks = getRoleFirstTasks(workspaceSlug, roleName);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-5xl mb-4">🚀</div>
        <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
        <p className="text-muted-foreground">
          Here are some suggested first steps to help you dive in
        </p>
      </div>

      {/* Task Cards */}
      <div className="space-y-3">
        {firstTasks.map((task) => (
          <div key={task.title}>
            <Link href={task.href as Route}>
              <Card
                className={`group hover:shadow-lg transition-colors cursor-pointer ${
                  task.priority === "high"
                    ? "border-primary/50 bg-gradient-to-r from-primary/5 to-transparent"
                    : ""
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-md transition-transform group-hover:scale-110 ${
                        task.priority === "high"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {task.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg flex items-center gap-2 mb-1">
                        {task.title}
                        {task.priority === "high" && (
                          <Sparkles className="h-4 w-4 text-foreground shrink-0" />
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {task.description}
                      </p>
                      <p className="text-sm font-medium text-primary flex items-center gap-1">
                        {task.action}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>

      {/* Completion Message */}
      <div className="text-center space-y-4 pt-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-3xl">🎓</span>
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                You're All Set!
              </h3>
            </div>
            <p className="text-sm text-green-700 dark:text-green-200 mb-4">
              You can always return to these suggestions from your dashboard.
              Don't hesitate to reach out to your team if you need help!
            </p>
            <Button
              onClick={onComplete}
              disabled={isLoading}
              size="lg"
              className="w-full sm:w-auto"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-xs text-muted-foreground">
          Need help? Use the help menu (?) or ask your workspace admin
        </p>
      </div>
    </div>
  );
}

/**
 * Generate role-specific first tasks
 */
function getRoleFirstTasks(
  workspaceSlug: string,
  roleName: string,
): FirstTask[] {
  const category = detectRoleCategory(roleName);

  switch (category) {
    case "owner":
    case "admin":
      return [
        {
          icon: <Users className="h-6 w-6" />,
          title: "Review Team Members",
          description:
            "See who's in your workspace and their roles. Get familiar with your team structure.",
          action: "View team",
          href: `/w/${workspaceSlug}/settings/members`,
          priority: "high",
        },
        {
          icon: <FileText className="h-6 w-6" />,
          title: "Explore Existing Content",
          description:
            "Browse through current content to understand what's already been created.",
          action: "Browse content",
          href: `/w/${workspaceSlug}/content`,
          priority: "high",
        },
        {
          icon: <BookOpen className="h-6 w-6" />,
          title: "Check Knowledge Base",
          description:
            "Review the workspace knowledge base and documentation library.",
          action: "View knowledge",
          href: `/w/${workspaceSlug}/knowledge`,
          priority: "medium",
        },
        {
          icon: <MessageCircle className="h-6 w-6" />,
          title: "Connect with Owner",
          description:
            "Reach out to the workspace owner to align on priorities and goals.",
          action: "Contact team",
          href: `/w/${workspaceSlug}/settings/members`,
          priority: "medium",
        },
      ];
    case "editor":
      return [
        {
          icon: <FileText className="h-6 w-6" />,
          title: "Browse Existing Content",
          description:
            "Get familiar with the content that's already been created and the topics being covered.",
          action: "Explore content",
          href: `/w/${workspaceSlug}/content`,
          priority: "high",
        },
        {
          icon: <BookOpen className="h-6 w-6" />,
          title: "Review Knowledge Base",
          description:
            "Check out the workspace knowledge base to understand available resources.",
          action: "View knowledge",
          href: `/w/${workspaceSlug}/knowledge`,
          priority: "high",
        },
        {
          icon: <FileText className="h-6 w-6" />,
          title: "Generate Your First Article",
          description:
            "Start from a keyword: research it, pick a title and an outline, and get a draft.",
          action: "Generate",
          href: `/w/${workspaceSlug}/generate_content`,
          priority: "medium",
        },
        {
          icon: <Users className="h-6 w-6" />,
          title: "Meet Your Teammates",
          description:
            "See who else is in the workspace and what they're working on.",
          action: "View team",
          href: `/w/${workspaceSlug}/settings/members`,
          priority: "low",
        },
      ];
    default:
      return [
        {
          icon: <FileText className="h-6 w-6" />,
          title: "Explore Content Library",
          description:
            "Browse through all the content in this workspace to get familiar with what's available.",
          action: "Browse content",
          href: `/w/${workspaceSlug}/content`,
          priority: "high",
        },
        {
          icon: <BookOpen className="h-6 w-6" />,
          title: "Check Knowledge Base",
          description:
            "Discover the workspace knowledge base and documentation resources.",
          action: "View knowledge",
          href: `/w/${workspaceSlug}/knowledge`,
          priority: "high",
        },
        {
          icon: <Users className="h-6 w-6" />,
          title: "Meet the Team",
          description:
            "See who's in your workspace and learn about their roles.",
          action: "View team",
          href: `/w/${workspaceSlug}/settings/members`,
          priority: "medium",
        },
        {
          icon: <MessageCircle className="h-6 w-6" />,
          title: "Ask Questions",
          description:
            "Don't hesitate to reach out to team members if you need guidance.",
          action: "Contact team",
          href: `/w/${workspaceSlug}/settings/members`,
          priority: "low",
        },
      ];
  }
}
