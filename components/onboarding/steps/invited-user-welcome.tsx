"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Building2, Crown, Shield, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Workspace } from "@/types/workspace";

interface InvitedUserWelcomeProps {
  workspace: Workspace;
  inviterName: string;
  roleName: string;
  roleDescription?: string;
  onNext: () => void;
  onSkip: () => void;
  isLoading?: boolean;
}

/**
 * Welcome step for invited users
 * Shows workspace details, inviter info, and assigned role
 */
export function InvitedUserWelcome({
  workspace,
  inviterName,
  roleName,
  roleDescription,
  onNext,
  onSkip,
  isLoading = false,
}: InvitedUserWelcomeProps) {
  const getRoleIcon = (role: string) => {
    const normalizedRole = role.toLowerCase();
    if (normalizedRole.includes("owner") || normalizedRole.includes("admin")) {
      return <Crown className="h-8 w-8 text-yellow-500" />;
    }
    if (
      normalizedRole.includes("editor") ||
      normalizedRole.includes("manager")
    ) {
      return <UserCheck className="h-8 w-8 text-blue-500" />;
    }
    return <Shield className="h-8 w-8 text-green-500" />;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Celebration Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <div className="text-6xl">🎉</div>
        <h2 className="text-3xl font-bold">Welcome!</h2>
        <p className="text-lg text-muted-foreground">
          You've been invited to join a workspace
        </p>
      </motion.div>

      {/* Workspace Info Card */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-2">
            <CardContent className="p-6 space-y-6">
              {/* Workspace Name */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    You're joining
                  </p>
                  <h3 className="text-2xl font-bold">
                    {workspace.name || "Workspace"}
                  </h3>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Inviter Info */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Invited by
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {inviterName.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-medium">{inviterName}</p>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Role Info */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Your role
                </p>
                <div className="flex items-center gap-4">
                  {getRoleIcon(roleName)}
                  <div className="flex-1">
                    <p className="text-lg font-semibold">{roleName}</p>
                    {roleDescription && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {roleDescription}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="text-center space-y-4"
      >
        <p className="text-muted-foreground">
          Let's take a quick tour to help you get started
        </p>
        <div className="flex gap-3 justify-center">
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
            Get Started
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
