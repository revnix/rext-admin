"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Users,
} from "lucide-react";
import { detectRoleCategory } from "@/lib/role-categories";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TourItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}

interface InvitedUserQuickTourProps {
  roleName: string;
  onNext: () => void;
  onSkip: () => void;
  isLoading?: boolean;
}

/**
 * Quick tour of key features for invited users
 * Content is tailored based on the user's role
 */
export function InvitedUserQuickTour({
  roleName,
  onNext,
  onSkip,
  isLoading = false,
}: InvitedUserQuickTourProps) {
  const tourItems = getRoleTourItems(roleName);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ opacity: 0, rotate: -10 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl mb-4"
        >
          📚
        </motion.div>
        <h2 className="text-2xl font-bold">Quick Tour</h2>
        <p className="text-muted-foreground">
          Here are the key features you'll use most often
        </p>
      </div>

      {/* Tour Items */}
      <div className="space-y-3">
        {tourItems.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card
              className={
                item.highlight
                  ? "border-primary shadow-md bg-gradient-to-br from-primary/5 to-transparent"
                  : ""
              }
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      item.highlight
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {item.title}
                      {item.highlight && (
                        <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                          Recommended
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1.5">
                      {item.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tip Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 dark:from-purple-950/20 dark:to-blue-950/20 dark:border-purple-900">
          <CardContent className="p-4 flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1 text-sm">
              <p className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                Don't worry about making mistakes!
              </p>
              <p className="text-purple-700 dark:text-purple-200">
                You can't break anything. Feel free to explore and try things
                out. Your teammates are here to help if you need guidance.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <div className="flex gap-3 justify-center pt-4">
        <Button
          variant="outline"
          onClick={onSkip}
          disabled={isLoading}
          className="min-w-32"
        >
          Skip Tour
        </Button>
        <Button
          onClick={onNext}
          disabled={isLoading}
          className="min-w-32"
          size="lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

/**
 * Generate role-specific tour items
 */
function getRoleTourItems(roleName: string): TourItem[] {
  const category = detectRoleCategory(roleName);

  // Base items everyone sees
  const baseItems: TourItem[] = [
    {
      icon: <LayoutDashboard className="h-6 w-6" />,
      title: "Dashboard",
      description:
        "Your central hub for workspace activity, stats, and quick actions",
      highlight: true,
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Members",
      description: "Connect with your teammates and see who's working on what",
      highlight: false,
    },
  ];

  switch (category) {
    case "owner":
    case "admin":
      return [
        ...baseItems,
        {
          icon: <FileText className="h-6 w-6" />,
          title: "Content Management",
          description:
            "Create, edit, and organize all workspace content and topics",
          highlight: true,
        },
        {
          icon: <Users className="h-6 w-6" />,
          title: "Team Management",
          description:
            "Invite new members, manage roles, and configure permissions",
          highlight: false,
        },
        {
          icon: <BookOpen className="h-6 w-6" />,
          title: "Knowledge Base",
          description:
            "Build and maintain your workspace's knowledge repository",
          highlight: false,
        },
      ];
    case "editor":
      return [
        ...baseItems,
        {
          icon: <FileText className="h-6 w-6" />,
          title: "Content Creation",
          description:
            "Create and edit content, organize topics, and collaborate with your team",
          highlight: true,
        },
        {
          icon: <BookOpen className="h-6 w-6" />,
          title: "Knowledge Base",
          description:
            "Access and contribute to the workspace knowledge repository",
          highlight: false,
        },
        {
          icon: <MessageSquare className="h-6 w-6" />,
          title: "Collaboration",
          description: "Share ideas and get feedback from team members",
          highlight: false,
        },
      ];
    default:
      return [
        ...baseItems,
        {
          icon: <FileText className="h-6 w-6" />,
          title: "Browse Content",
          description:
            "Explore all workspace content and stay up-to-date with the team",
          highlight: true,
        },
        {
          icon: <BookOpen className="h-6 w-6" />,
          title: "Knowledge Base",
          description: "Access the workspace knowledge base and documentation",
          highlight: false,
        },
      ];
  }
}
