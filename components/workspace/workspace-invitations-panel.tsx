"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  Mail,
  MailCheck,
  MailX,
  MoreHorizontal,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";

interface WorkspaceInvitationsPanelProps {
  workspaceId: string;
}

interface Invitation {
  id: string;
  workspace_id: string;
  email: string;
  role_id: string;
  status: string;
  expires_at: string;
  created_at: string;
  workspace_name?: string;
  role_name?: string;
}

function InvitationSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-8 w-8" />
    </div>
  );
}

function EmptyInvitations() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Mail className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No pending invitations</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Invitations you send will appear here
        </p>
      </CardContent>
    </Card>
  );
}

export function WorkspaceInvitationsPanel({
  workspaceId,
}: WorkspaceInvitationsPanelProps) {
  const queryClient = useQueryClient();

  // Fetch sent invitations
  const {
    data: invitationsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["sent-invitations", workspaceId],
    queryFn: () => apiClient.invitations.listSent(workspaceId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const invitations = invitationsResponse?.invitations || [];

  // Revoke invitation mutation
  const revokeInvitationMutation = useMutation({
    mutationFn: (invitationId: string) =>
      apiClient.invitations.revoke(workspaceId, invitationId),
    onSuccess: () => {
      toast.success("Invitation revoked successfully");
      queryClient.invalidateQueries({
        queryKey: ["sent-invitations", workspaceId],
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to revoke invitation: ${error.message}`);
    },
  });

  const handleRevokeInvitation = async (invitationId: string) => {
    await revokeInvitationMutation.mutateAsync(invitationId);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if invitation is expired
  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  // Get time until expiration
  const getTimeUntilExpiration = (expiresAt: string) => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diffMs = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Expires today";
    if (diffDays === 1) return "Expires tomorrow";
    return `Expires in ${diffDays} days`;
  };

  // Get status badge variant and icon
  const getStatusDisplay = (invitation: Invitation) => {
    if (isExpired(invitation.expires_at)) {
      return {
        variant: "outline" as const,
        label: "Expired",
        icon: <Clock className="h-3 w-3" />,
      };
    }

    switch (invitation.status.toLowerCase()) {
      case "pending":
        return {
          variant: "secondary" as const,
          label: "Pending",
          icon: <Send className="h-3 w-3" />,
        };
      case "accepted":
        return {
          variant: "default" as const,
          label: "Accepted",
          icon: <MailCheck className="h-3 w-3" />,
        };
      case "revoked":
        return {
          variant: "destructive" as const,
          label: "Revoked",
          icon: <MailX className="h-3 w-3" />,
        };
      default:
        return {
          variant: "secondary" as const,
          label: invitation.status,
          icon: <Mail className="h-3 w-3" />,
        };
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Sent Invitations
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {invitations.length}{" "}
              {invitations.length === 1 ? "invitation" : "invitations"} sent
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <InvitationSkeleton />
            <InvitationSkeleton />
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive mb-4">
                Failed to load invitations
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : invitations.length === 0 ? (
          <EmptyInvitations />
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation: Invitation) => {
              const statusDisplay = getStatusDisplay(invitation);
              const expired = isExpired(invitation.expires_at);
              const canRevoke =
                invitation.status.toLowerCase() === "pending" && !expired;

              return (
                <div
                  key={invitation.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  {/* Invitation Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{invitation.email}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span>{invitation.role_name || "Unknown Role"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Sent {formatDate(invitation.created_at)}
                      </span>
                      <span
                        className={`flex items-center gap-1 ${
                          expired ? "text-destructive" : ""
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {getTimeUntilExpiration(invitation.expires_at)}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <Badge
                    variant={statusDisplay.variant}
                    className="text-xs flex items-center gap-1"
                  >
                    {statusDisplay.icon}
                    {statusDisplay.label}
                  </Badge>

                  {/* Actions Menu */}
                  {canRevoke && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleRevokeInvitation(invitation.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Revoke Invitation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
