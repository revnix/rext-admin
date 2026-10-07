"use client";

import { Building2, Mail, Shield } from "lucide-react";
import { Notice } from "@/components/ui/notice";
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
 * An info Notice, so it reads like the app's other notes.
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
    return <Skeleton className="mb-6 h-24 w-full rounded-(--card-radius)" />;
  }

  return (
    <Notice
      className="mb-6"
      title={<>You're invited to join {workspaceName || "a workspace"}</>}
    >
      <div className="mt-1 space-y-1 text-muted-foreground">
        {inviterName && (
          <div className="flex items-center gap-2">
            <span className="font-medium">Invited by:</span>
            <span>{inviterName}</span>
          </div>
        )}

        {roleName && (
          <div className="flex items-center gap-2">
            <Shield className="size-3.5" aria-hidden />
            <span className="font-medium">Role:</span>
            <span className="capitalize">{roleName}</span>
          </div>
        )}

        {workspaceSlug && (
          <div className="flex items-center gap-2">
            <Building2 className="size-3.5" aria-hidden />
            <span className="font-medium">Workspace:</span>
            <span className="font-mono text-xs">{workspaceSlug}</span>
          </div>
        )}

        {inviteeEmail && (
          <div className="flex items-center gap-2">
            <Mail className="size-3.5" aria-hidden />
            <span className="font-medium">Email:</span>
            <span className="font-mono text-xs">{inviteeEmail}</span>
          </div>
        )}

        <p className="pt-1 text-xs">
          Create your account below to join the workspace
        </p>
      </div>
    </Notice>
  );
}
