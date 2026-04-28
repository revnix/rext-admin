"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  Copy,
  Mail,
  MailCheck,
  MailX,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import type { Column, RowAction } from "@/types/data-table";

interface WorkspaceInvitationsPanelProps {
  workspaceId: string;
  canManage?: boolean;
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

interface InvitationData extends Record<string, unknown> {
  id: string;
  email: string;
  role_name: string;
  status: string;
  created_at: string;
  expires_at: string;
  expired: boolean;
  expiration_text: string;
  status_variant: "default" | "secondary" | "outline" | "destructive";
  status_icon: React.ReactNode;
}

export function WorkspaceInvitationsPanel({
  workspaceId,
  canManage = false,
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

  // Resend invitation mutation
  const resendInvitationMutation = useMutation({
    mutationFn: (invitationId: string) =>
      apiClient.invitations.resend(workspaceId, invitationId),
    onSuccess: () => {
      toast.success("Invitation resent successfully");
      queryClient.invalidateQueries({
        queryKey: ["sent-invitations", workspaceId],
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to resend invitation: ${error.message}`);
    },
  });

  const handleResendInvitation = async (invitationId: string) => {
    await resendInvitationMutation.mutateAsync(invitationId);
  };

  // Copy invitation link
  const handleCopyInvitationLink = (invitation: Invitation) => {
    // Note: We don't have the token in the list response
    // For security, tokens are not returned in list endpoints
    // We'll copy the email instead and show a helpful message
    navigator.clipboard.writeText(invitation.email);
    toast.info(
      "Email copied! Use 'Resend' to send a new invitation with a fresh link.",
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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

  // Transform data for DataTable
  const tableData: InvitationData[] = invitations.map(
    (invitation: Invitation) => {
      const statusDisplay = getStatusDisplay(invitation);
      const expired = isExpired(invitation.expires_at);

      return {
        id: invitation.id,
        email: invitation.email,
        role_name: invitation.role_name || "Unknown Role",
        status: statusDisplay.label,
        created_at: formatDate(invitation.created_at),
        expires_at: formatDate(invitation.expires_at),
        expired,
        expiration_text: getTimeUntilExpiration(invitation.expires_at),
        status_variant: statusDisplay.variant,
        status_icon: statusDisplay.icon,
      };
    },
  );

  // Define columns
  const columns: Column<InvitationData>[] = [
    {
      key: "email",
      header: "Email",
      width: "300px",
      cell: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{value as string}</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="truncate">{row.role_name}</span>
            </div>
          </div>
        </div>
      ),
      searchable: true,
    },
    {
      key: "status",
      header: "Status",
      width: "120px",
      cell: (value, row) => (
        <Badge
          variant={
            row.status_variant as
              | "default"
              | "secondary"
              | "outline"
              | "destructive"
          }
          className="text-xs flex items-center gap-1 w-fit"
        >
          {row.status_icon}
          {value as string}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Sent",
      width: "150px",
      cell: (value) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{value as string}</span>
        </div>
      ),
    },
    {
      key: "expiration_text",
      header: "Expiration",
      width: "150px",
      cell: (value, row) => (
        <div
          className={`flex items-center gap-1 text-sm ${
            row.expired ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          <Clock className="h-3 w-3" />
          <span>{value as string}</span>
        </div>
      ),
    },
  ];

  // Define row actions
  const rowActions: RowAction<InvitationData>[] = [
    {
      label: "Resend",
      icon: <Send className="h-4 w-4" />,
      onClick: (row) => {
        handleResendInvitation(row.id as string);
      },
      variant: "default",
      disabled: (row) => {
        const expired = row.expired as boolean;
        const status = (row.status as string).toLowerCase();
        return status !== "pending" || expired;
      },
    },
    {
      label: "Copy Email",
      icon: <Copy className="h-4 w-4" />,
      onClick: (row) => {
        const invitation = invitations.find(
          (inv: Invitation) => inv.id === row.id,
        );
        if (invitation) {
          handleCopyInvitationLink(invitation);
        }
      },
      variant: "default",
    },
    {
      label: "Revoke",
      icon: <XCircle className="h-4 w-4" />,
      onClick: (row) => {
        handleRevokeInvitation(row.id as string);
      },
      variant: "destructive",
      requiresConfirmation: true,
      confirmationTitle: "Revoke Invitation",
      confirmationDescription:
        "Are you sure you want to revoke this invitation? The recipient will no longer be able to use this link.",
      disabled: (row) => {
        const expired = row.expired as boolean;
        const status = (row.status as string).toLowerCase();
        return status !== "pending" || expired;
      },
    },
  ];

  const headerActions = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => refetch()}
      disabled={isLoading}
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Sent Invitations
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={tableData}
          isLoading={isLoading}
          rowActions={canManage ? rowActions : []}
          emptyTitle="No invitations sent"
          emptyDescription="Invitations you send will appear here"
          emptyIcon={<Mail className="h-12 w-12" />}
          emptyActions={[]}
          searchPlaceholder="Search by email..."
          searchFields={["email"]}
          actions={headerActions}
          pageSize={10}
          pageSizeOptions={[10, 25, 50]}
          tableId="workspace-invitations"
        />

        {error && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-md text-sm text-destructive">
            Failed to load invitations. Please try again.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
