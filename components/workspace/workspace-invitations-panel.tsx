"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, RefreshCw, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableRowAction,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { apiClient } from "@/lib/api-client";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { cn } from "@/lib/utils";

interface WorkspaceInvitationsPanelProps {
  workspaceId: string;
  canResend?: boolean;
  canRevoke?: boolean;
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

const isExpired = (invitation: Invitation) =>
  new Date(invitation.expires_at) < new Date();

/** What the invitation is now: an expired one reads Expired whatever its stored status. */
function statusOf(invitation: Invitation): {
  label: string;
  variant: BadgeProps["variant"];
} {
  if (isExpired(invitation)) return { label: "Expired", variant: "neutral" };
  switch (invitation.status.toLowerCase()) {
    case "pending":
      return { label: "Pending", variant: "warning" };
    case "accepted":
      return { label: "Accepted", variant: "success" };
    case "revoked":
      return { label: "Revoked", variant: "neutral" };
    default:
      return { label: invitation.status, variant: "neutral" };
  }
}

function expiresIn(invitation: Invitation) {
  const days = Math.ceil(
    (new Date(invitation.expires_at).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24),
  );
  if (days < 0) return "Expired";
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days} days`;
}

const column = createDataTableColumnHelper<Invitation>();

const columns = column.columns([
  column.accessor("email", {
    header: "Email",
    cell: ({ row, getValue }) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{getValue()}</p>
        <p className="truncate text-muted-foreground">
          {row.original.role_name || "Unknown role"}
        </p>
      </div>
    ),
  }),
  column.accessor((invitation) => statusOf(invitation).label, {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = statusOf(row.original);
      return <Badge variant={status.variant}>{status.label}</Badge>;
    },
    enableGlobalFilter: false,
  }),
  column.accessor((invitation) => Date.parse(invitation.created_at) || 0, {
    id: "created_at",
    header: "Sent",
    meta: { align: "end", numeric: true },
    cell: ({ row }) => dateFormat.short(row.original.created_at),
    sortFn: "basic",
    enableGlobalFilter: false,
  }),
  column.accessor((invitation) => Date.parse(invitation.expires_at) || 0, {
    id: "expires_at",
    header: "Expiration",
    meta: { align: "end" },
    cell: ({ row }) => (
      <span className={cn(isExpired(row.original) && "text-destructive")}>
        {expiresIn(row.original)}
      </span>
    ),
    sortFn: "basic",
    enableGlobalFilter: false,
  }),
]);

const NO_INVITATIONS: Invitation[] = [];

export function WorkspaceInvitationsPanel({
  workspaceId,
  canResend = false,
  canRevoke = false,
}: WorkspaceInvitationsPanelProps) {
  const queryClient = useQueryClient();
  const { confirm, ConfirmationComponent } = useConfirmation();

  // The backend returns every sent invitation at once, so the table searches and sorts them here.
  const {
    data: invitationsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["sent-invitations", workspaceId],
    queryFn: () => apiClient.invitations.listSent(workspaceId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
  const invitations: Invitation[] =
    invitationsResponse?.invitations ?? NO_INVITATIONS;

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

  // We don't have the token in the list response (list endpoints never return
  // it), so this copies the email, and Resend sends a fresh link.
  const copyEmail = (invitation: Invitation) => {
    navigator.clipboard.writeText(invitation.email);
    toast.info(
      "Email copied! Use 'Resend' to send a new invitation with a fresh link.",
    );
  };

  const revoke = async (invitation: Invitation) => {
    const confirmed = await confirm({
      title: "Revoke this invitation?",
      description: `${invitation.email} will no longer be able to use its link.`,
      confirmText: "Revoke",
      variant: "destructive",
    });
    if (confirmed) await revokeInvitationMutation.mutateAsync(invitation.id);
  };

  // Resend and revoke are gated on member.invite, the permission their backend routes enforce.
  const rowActions = (invitation: Invitation): DataTableRowAction[] => {
    const open =
      invitation.status.toLowerCase() === "pending" && !isExpired(invitation)
        ? false
        : "Only a pending invitation can change";
    return [
      ...(canResend
        ? [
            {
              label: "Resend",
              icon: Send,
              disabled: open,
              onSelect: () => resendInvitationMutation.mutate(invitation.id),
            },
          ]
        : []),
      {
        label: "Copy email",
        icon: Copy,
        onSelect: () => copyEmail(invitation),
      },
      ...(canRevoke
        ? [
            {
              label: "Revoke",
              icon: XCircle,
              destructive: true,
              disabled: open,
              onSelect: () => void revoke(invitation),
            },
          ]
        : []),
    ];
  };

  return (
    <>
      <DataTable
        caption="Sent invitations"
        columns={columns}
        data={invitations}
        getRowId={(invitation) => invitation.id}
        getRowLabel={(invitation) => invitation.email}
        isLoading={isLoading}
        error={
          error ? (
            <p className="rounded-(--card-radius) border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
              Failed to load invitations. Please try again.
            </p>
          ) : undefined
        }
        emptyState={
          <EmptyState
            title="No invitations sent"
            description="Invitations you send will appear here."
          />
        }
        search={{ placeholder: "Search by email" }}
        actions={
          <Button
            data-rec="show"
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            aria-label="Refresh invitations"
          >
            <RefreshCw className={isFetching ? "animate-spin" : undefined} />
          </Button>
        }
        rowActions={rowActions}
        pageSizeOptions={[10, 25, 50]}
        // Beside the members, in the same settings section: cards when they are.
        cardsWhen="narrow"
        renderCard={(invitation, { actions }) => {
          const status = statusOf(invitation);
          return (
            <div className="flex items-start gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="truncate font-medium text-foreground">
                  {invitation.email}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <span>{expiresIn(invitation)}</span>
                </div>
              </div>
              {actions}
            </div>
          );
        }}
      />
      {ConfirmationComponent}
    </>
  );
}
