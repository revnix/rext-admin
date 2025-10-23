"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { CreateAdminInvitationDialog } from "@/components/admin/create-admin-invitation-dialog";
import { PageLayout } from "@/components/page-layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import type { AdminInvitation } from "@/types/admin-invitation";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    color: "bg-green-500/10 text-green-700 border-green-200",
  },
  declined: {
    label: "Declined",
    icon: XCircle,
    color: "bg-red-500/10 text-red-700 border-red-200",
  },
  revoked: {
    label: "Revoked",
    icon: Ban,
    color: "bg-gray-500/10 text-gray-700 border-gray-200",
  },
  expired: {
    label: "Expired",
    icon: AlertCircle,
    color: "bg-orange-500/10 text-orange-700 border-orange-200",
  },
} as const;

export default function AdminInvitationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [revokeDialog, setRevokeDialog] = useState<{
    open: boolean;
    invitation?: AdminInvitation;
  }>({ open: false });

  const breadcrumbs = [
    { label: "Admin", href: "/admin" },
    { label: "Platform", href: "/admin/platform" },
    { label: "Admin Invitations" },
  ];

  // Fetch invitations
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-invitations", selectedStatus],
    queryFn: () =>
      apiClient.adminInvitations.list({
        status: selectedStatus === "all" ? undefined : selectedStatus,
        limit: 100,
        offset: 0,
      }),
  });

  // Resend mutation
  const resendMutation = useMutation({
    mutationFn: (invitationId: string) =>
      apiClient.adminInvitations.resend(invitationId),
    onSuccess: () => {
      toast.success("Invitation resent - A new invitation email has been sent");
      queryClient.invalidateQueries({ queryKey: ["admin-invitations"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to resend invitation: ${error.message}`);
    },
  });

  // Revoke mutation
  const revokeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.adminInvitations.revoke(id, reason),
    onSuccess: () => {
      toast.success("Invitation revoked - The invitation has been cancelled");
      queryClient.invalidateQueries({ queryKey: ["admin-invitations"] });
      setRevokeDialog({ open: false });
    },
    onError: (error: Error) => {
      toast.error(`Failed to revoke invitation: ${error.message}`);
    },
  });

  const handleResend = (invitationId: string) => {
    resendMutation.mutate(invitationId);
  };

  const handleRevoke = (invitation: AdminInvitation) => {
    setRevokeDialog({ open: true, invitation });
  };

  const confirmRevoke = () => {
    if (revokeDialog.invitation) {
      revokeMutation.mutate({
        id: revokeDialog.invitation.id,
        reason: "Revoked by admin",
      });
    }
  };

  const invitations = data?.invitations || [];
  const stats = {
    total: invitations.length,
    pending: invitations.filter((i) => i.status === "pending").length,
    accepted: invitations.filter((i) => i.status === "accepted").length,
    declined: invitations.filter((i) => i.status === "declined").length,
  };

  return (
    <PageLayout
      title="Platform Admin Invitations"
      description="Manage invitations for platform-level administrators"
      breadcrumbs={breadcrumbs}
      actions={
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Invite Admin
        </Button>
      }
    >
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invitations
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Declined</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.declined}</div>
          </CardContent>
        </Card>
      </div>

      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Admin Invitations</CardTitle>
              <CardDescription>
                View and manage platform administrator invitations
              </CardDescription>
            </div>
            <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="accepted">Accepted</TabsTrigger>
                <TabsTrigger value="declined">Declined</TabsTrigger>
                <TabsTrigger value="revoked">Revoked</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={`skeleton-loading-${i.toString()}`}
                  className="h-12 w-full"
                />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              Failed to load invitations
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">
                No invitations found
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {selectedStatus === "all"
                  ? "Get started by inviting your first admin"
                  : `No ${selectedStatus} invitations`}
              </p>
              {selectedStatus === "all" && (
                <Button
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Invite Admin
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => {
                  const StatusIcon = STATUS_CONFIG[invitation.status].icon;
                  return (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">
                        {invitation.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {invitation.admin_role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_CONFIG[invitation.status].color}
                        >
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {STATUS_CONFIG[invitation.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {invitation.invited_by_name || "Unknown"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(invitation.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {invitation.is_expired ? (
                          <span className="text-red-600">Expired</span>
                        ) : invitation.status === "pending" ? (
                          formatDistanceToNow(new Date(invitation.expires_at), {
                            addSuffix: true,
                          })
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {invitation.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleResend(invitation.id)}
                                  disabled={resendMutation.isPending}
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Resend Invitation
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRevoke(invitation)}
                                  disabled={revokeMutation.isPending}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Revoke
                                </DropdownMenuItem>
                              </>
                            )}
                            {invitation.status !== "pending" && (
                              <DropdownMenuItem disabled>
                                No actions available
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateAdminInvitationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <AlertDialog
        open={revokeDialog.open}
        onOpenChange={(open) => setRevokeDialog({ open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke admin invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the invitation for{" "}
              <span className="font-medium">
                {revokeDialog.invitation?.email}
              </span>
              . They will no longer be able to accept this invitation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
