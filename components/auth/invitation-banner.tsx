"use client";

import { Building2, Mail, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface InvitationBannerProps {
  workspaceName?: string;
  workspaceSlug?: string;
  inviterName?: string;
  roleName?: string;
  inviteeEmail?: string;
  isLoading?: boolean;
}

/**
 * InvitationBanner Component
 *
 * Displays invitation context above signup/login forms.
 * Shows workspace information, inviter details, and role being granted.
 *
 * Design: Uses ShadCN Alert component with custom styling to match
 * invitation email aesthetics.
 */
export function InvitationBanner({
  workspaceName,
  workspaceSlug,
  inviterName,
  roleName,
  inviteeEmail,
  isLoading = false,
}: InvitationBannerProps) {
  if (isLoading) {
    return (
      <Alert className="mb-6 border-primary/20 bg-primary/5">
        <div className="flex items-start gap-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </Alert>
    );
  }

  if (!workspaceName && !inviteeEmail) {
    return null;
  }

  return (
    <Alert className="mb-6 border-primary/20 bg-primary/5">
      <Mail className="h-5 w-5 text-primary" />
      <AlertDescription className="mt-0 ml-8">
        <div className="space-y-2">
          {/* Main invitation message */}
          <p className="font-semibold text-foreground">
            You're invited to join{" "}
            <span className="text-primary">
              {workspaceName || "a workspace"}
            </span>
          </p>

          {/* Details */}
          <div className="space-y-1 text-sm text-muted-foreground">
            {inviterName && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Invited by:</span>
                <span>{inviterName}</span>
              </div>
            )}

            {roleName && (
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" />
                <span className="font-medium">Role:</span>
                <span className="capitalize">{roleName}</span>
              </div>
            )}

            {workspaceSlug && (
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                <span className="font-medium">Workspace:</span>
                <span className="font-mono text-xs">{workspaceSlug}</span>
              </div>
            )}

            {inviteeEmail && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                <span className="font-medium">Email:</span>
                <span className="font-mono text-xs">{inviteeEmail}</span>
              </div>
            )}
          </div>

          {/* Helper text */}
          <p className="text-xs text-muted-foreground pt-1">
            Create your account below to join the workspace
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
