"use client";

import {
  Building2,
  Check,
  Clock,
  Mail,
  Shield,
  UserPlus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePendingInvitations } from "@/hooks/use-pending-invitations";
import type { PendingInvitation } from "@/types/invitation";

/**
 * PendingInvitationsCard Component
 *
 * Displays pending workspace invitations on the dashboard.
 * Allows users to accept or decline invitations directly from the card.
 *
 * Features:
 * - Shows all pending invitations with workspace and role details
 * - Accept/decline actions with optimistic UI updates
 * - Empty state when no pending invitations
 * - Loading state while fetching
 * - Error handling with toast notifications
 * - Automatic refresh after actions
 *
 * Placement: Dashboard sidebar (right column)
 */
export function PendingInvitationsCard() {
  const {
    invitations,
    isLoading,
    acceptInvitation,
    declineInvitation,
    isAccepting,
    isDeclining,
  } = usePendingInvitations();

  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Don't show card if no invitations and not loading
  if (!isLoading && (!invitations || invitations.count === 0)) {
    return null;
  }

  const handleAccept = async (invitation: PendingInvitation) => {
    setProcessingId(invitation.id);
    try {
      await acceptInvitation(invitation.token);

      toast.success("Invitation Accepted!", {
        description: `You've successfully joined ${invitation.workspace_name}`,
      });

      // Note: We don't have workspace slug in this response, so redirect to dashboard
      router.refresh();
    } catch (error) {
      toast.error("Failed to Accept Invitation", {
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitation: PendingInvitation) => {
    setProcessingId(invitation.id);
    try {
      await declineInvitation(invitation.id);

      toast.success("Invitation Declined", {
        description: `You've declined the invitation to ${invitation.workspace_name}`,
      });
    } catch (error) {
      toast.error("Failed to Decline Invitation", {
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Calculate time until expiration
  const getExpirationText = (expiresAt: string): string => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diffMs = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Expires today";
    if (diffDays === 1) return "Expires tomorrow";
    return `Expires in ${diffDays} days`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Pending Invitations
        </CardTitle>
        <CardDescription>
          {isLoading
            ? "Loading invitations..."
            : `${invitations?.count || 0} workspace invitation${invitations?.count === 1 ? "" : "s"
            }`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-3 p-4 border rounded-lg">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </div>
            ))}
          </div>
        ) : invitations && invitations.count > 0 ? (
          <div className="space-y-3">
            {invitations.invitations.map((invitation) => {
              const isProcessing = processingId === invitation.id;
              const expirationText = getExpirationText(invitation.expires_at);
              const isExpired = expirationText === "Expired";

              return (
                <div
                  key={invitation.id}
                  className={`p-4 border rounded-lg space-y-3 ${isExpired ? "opacity-60 bg-muted/30" : "bg-card"
                    }`}
                >
                  {/* Workspace Info */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Building2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {invitation.workspace_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {typeof invitation.invited_by === 'string' ? invitation.invited_by : invitation.invited_by.name}
                        </p>
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div className="flex items-center gap-2 text-xs">
                      <Shield className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Role:{" "}
                        <span className="font-medium text-foreground">
                          {invitation.role_name}
                        </span>
                      </span>
                    </div>

                    {/* Expiration */}
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span
                        className={
                          isExpired
                            ? "text-destructive font-medium"
                            : "text-muted-foreground"
                        }
                      >
                        {expirationText}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isExpired && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAccept(invitation)}
                        disabled={isProcessing || isAccepting || isDeclining}
                      >
                        {isProcessing && processingId === invitation.id ? (
                          <>
                            <div className="h-3 w-3 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-2" />
                            Accept
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDecline(invitation)}
                        disabled={isProcessing || isAccepting || isDeclining}
                      >
                        <X className="h-3 w-3 mr-2" />
                        Decline
                      </Button>
                    </div>
                  )}

                  {isExpired && (
                    <p className="text-xs text-center text-muted-foreground italic">
                      This invitation has expired
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-6 text-muted-foreground">
            <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No pending invitations</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
