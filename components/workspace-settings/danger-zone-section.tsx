"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { Route } from "next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceDeleteDialog } from "@/components/workspace";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { apiClient } from "@/lib/api-client";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { settingsRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";
import { SettingsGroup } from "@/components/settings/settings-group";

/**
 * Workspace settings, Danger zone: hand the workspace to another member, or delete it. Both are the
 * owner's (workspace.delete); deleting asks for the typed name, and the workspace waits in the
 * account's trash for 30 days.
 */
export function DangerZoneSection() {
  const { workspace, workspaceId } = useWorkspace();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission: isOwner, isLoading: isPermissionLoading } =
    useWorkspacePermission(WORKSPACE_PERMISSIONS.DELETE, workspaceId);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Only fetched while the transfer dialog is open; the owner row is excluded
  // since it is the caller.
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ["workspace-members", workspace?.id],
    queryFn: () => apiClient.members.list(workspace?.id ?? ""),
    enabled: transferDialogOpen && Boolean(workspace?.id),
  });

  const candidates = (membersData?.members ?? []).filter(
    (m) => !m.is_owner && m.status === "active",
  );
  const newOwner = candidates.find((m) => m.user_id === newOwnerId);

  const handleTransfer = async () => {
    if (!workspace?.id || !newOwnerId) return;
    setIsTransferring(true);
    try {
      await apiClient.workspaces.transferOwnership(workspace.id, newOwnerId);
      toast.success(
        `${newOwner?.user.name ?? "The member you chose"} owns this workspace now; you're one of its admins.`,
      );
      setTransferDialogOpen(false);
      setNewOwnerId("");
      // Permissions, owner info and the Members table all changed.
      await queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          queryKey[0] === "workspaces" ||
          queryKey[0] === "workspace-members" ||
          String(queryKey[0]).startsWith("workspace-permission"),
      });
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The workspace couldn't be transferred. Try again.",
      );
    } finally {
      setIsTransferring(false);
    }
  };

  if (!workspace?.id || isPermissionLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!isOwner) {
    return (
      <Notice title="Only the workspace's owner can do this">
        Transferring and deleting the workspace are the owner's to do.
      </Notice>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <SettingsGroup
        title="Transfer ownership"
        description="Make another active member the owner. You stay in the workspace as an admin, and only the new owner can delete or transfer it."
        action={
          <AlertDialog
            open={transferDialogOpen}
            onOpenChange={(open) => {
              setTransferDialogOpen(open);
              if (!open) setNewOwnerId("");
            }}
          >
            <AlertDialogTrigger asChild>
              <Button
                data-rec="show"
                variant="outline"
                disabled={isTransferring}
              >
                Transfer ownership
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Transfer "{workspace.name}"?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  The member you choose becomes the owner. You become an admin
                  and can no longer delete the workspace or transfer it again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Field>
                <FieldLabel data-rec="show" htmlFor="new-owner">
                  New owner
                </FieldLabel>
                <Select
                  value={newOwnerId}
                  onValueChange={setNewOwnerId}
                  disabled={membersLoading || isTransferring}
                >
                  <SelectTrigger id="new-owner" className="w-full">
                    <SelectValue
                      placeholder={
                        membersLoading
                          ? "Loading members…"
                          : candidates.length === 0
                            ? "No other active members"
                            : "Choose a member"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.user.name}{" "}
                        <span className="text-muted-foreground">
                          {m.user.email}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isTransferring}>
                  Keep ownership
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleTransfer();
                  }}
                  disabled={!newOwnerId || isTransferring}
                >
                  {isTransferring ? "Transferring…" : "Transfer ownership"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        }
      />

      <SettingsGroup
        title="Delete workspace"
        description={
          <>
            Everyone loses access to the workspace at once. It waits in{" "}
            <Link
              href={settingsRoutes.data}
              className="font-medium text-foreground underline underline-offset-4"
            >
              your account's trash
            </Link>{" "}
            for 30 days, where you can restore it, and is then deleted for good.
          </>
        }
        action={
          <WorkspaceDeleteDialog
            workspace={workspace}
            trigger={
              <Button data-rec="show" variant="destructive">
                Delete workspace
              </Button>
            }
            onDeleted={() => router.push("/" as Route)}
            onRestored={() => router.refresh()}
          />
        }
      />
    </div>
  );
}
