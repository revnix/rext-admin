"use client";

import { motion } from "framer-motion";
import { Check, FileText, Settings, Shield, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Permission {
  name: string;
  description: string;
  allowed: boolean;
  icon: React.ReactNode;
}

interface InvitedUserPermissionsProps {
  roleName: string;
  permissions: Permission[];
  onNext: () => void;
  onSkip: () => void;
  isLoading?: boolean;
}

/**
 * Role permissions explanation for invited users
 * Shows what they can and cannot do with their assigned role
 */
export function InvitedUserPermissions({
  roleName,
  permissions,
  onNext,
  onSkip,
  isLoading = false,
}: InvitedUserPermissionsProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4"
        >
          <Shield className="h-8 w-8 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold">Your Role: {roleName}</h2>
        <p className="text-muted-foreground">
          Here's what you can do in this workspace
        </p>
      </div>

      {/* Permissions Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {permissions.map((permission, index) => (
          <motion.div
            key={permission.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              className={`h-full transition-colors ${
                permission.allowed
                  ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20"
                  : "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      permission.allowed
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {permission.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      {permission.name}
                      {permission.allowed ? (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {permission.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 <strong>Need different permissions?</strong> Contact the
              workspace owner or an admin to update your role.
            </p>
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
 * Helper function to generate role-based permissions
 * Maps common role types to permission sets
 */
export function getRolePermissions(roleName: string): Permission[] {
  const normalizedRole = roleName.toLowerCase();

  // Owner permissions
  if (normalizedRole.includes("owner")) {
    return [
      {
        name: "Manage Content",
        description: "Create, edit, and delete all content",
        allowed: true,
        icon: <FileText className="h-5 w-5" />,
      },
      {
        name: "Manage Team",
        description: "Invite and manage team members",
        allowed: true,
        icon: <Users className="h-5 w-5" />,
      },
      {
        name: "Workspace Settings",
        description: "Configure workspace and billing",
        allowed: true,
        icon: <Settings className="h-5 w-5" />,
      },
      {
        name: "Full Access",
        description: "Complete control over the workspace",
        allowed: true,
        icon: <Shield className="h-5 w-5" />,
      },
    ];
  }

  // Admin permissions
  if (normalizedRole.includes("admin")) {
    return [
      {
        name: "Manage Content",
        description: "Create, edit, and delete all content",
        allowed: true,
        icon: <FileText className="h-5 w-5" />,
      },
      {
        name: "Manage Team",
        description: "Invite and manage team members",
        allowed: true,
        icon: <Users className="h-5 w-5" />,
      },
      {
        name: "Workspace Settings",
        description: "Configure workspace settings",
        allowed: true,
        icon: <Settings className="h-5 w-5" />,
      },
      {
        name: "Billing Access",
        description: "Manage subscription and payments",
        allowed: false,
        icon: <Shield className="h-5 w-5" />,
      },
    ];
  }

  // Editor/Manager permissions
  if (normalizedRole.includes("editor") || normalizedRole.includes("manager")) {
    return [
      {
        name: "Create Content",
        description: "Create and edit your own content",
        allowed: true,
        icon: <FileText className="h-5 w-5" />,
      },
      {
        name: "Manage Topics",
        description: "Organize and manage content topics",
        allowed: true,
        icon: <Settings className="h-5 w-5" />,
      },
      {
        name: "View Team",
        description: "See workspace members and activity",
        allowed: true,
        icon: <Users className="h-5 w-5" />,
      },
      {
        name: "Manage Team",
        description: "Invite or remove team members",
        allowed: false,
        icon: <Shield className="h-5 w-5" />,
      },
    ];
  }

  // Viewer/Member permissions (default)
  return [
    {
      name: "View Content",
      description: "Browse and read all content",
      allowed: true,
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "View Team",
      description: "See workspace members",
      allowed: true,
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Create Content",
      description: "Create or edit content",
      allowed: false,
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Manage Settings",
      description: "Configure workspace settings",
      allowed: false,
      icon: <Settings className="h-5 w-5" />,
    },
  ];
}
