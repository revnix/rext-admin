"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Eye, EyeOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/permission/permission-guard";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";
import type { Route } from "next";

export function DangerZoneSection() {
  const { workspace } = useWorkspace();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
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
        `Ownership transferred to ${newOwner?.user.name ?? "the selected member"}. You are now a Workspace Admin.`,
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
        error instanceof Error ? error.message : "Failed to transfer ownership",
      );
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDelete = async () => {
    if (!passwordConfirmation) {
      toast.error("Please enter your password to confirm deletion.");
      return;
    }

    setIsDeleting(true);
    try {
      // First verify password
      try {
        await apiClient.request("/api/v1/user/verify-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: passwordConfirmation }),
        });
      } catch {
        toast.error("The password you entered is incorrect.");
        setIsDeleting(false);
        return;
      }

      // Delete workspace
      await apiClient.workspaces.delete(workspace?.id || "");

      // Show success message with recovery info
      toast.success(
        "The workspace has been deleted. You have 14 days to recover it.",
      );

      setDeleteDialogOpen(false);
      setPasswordConfirmation("");
      setShowPassword(false);
      router.push("/" as Route);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete workspace";
      toast.error(errorMessage);
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>
          Irreversible actions that permanently affect your workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PermissionGuard
          permission={WORKSPACE_PERMISSIONS.DELETE}
          fallback={
            <p className="text-sm text-muted-foreground">
              Only workspace owners can delete the workspace.
            </p>
          }
        >
          <div className="space-y-4">
            {/* Transfer Ownership */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-md">
              <div>
                <h4 className="text-sm font-medium">Transfer Ownership</h4>
                <p className="text-sm text-muted-foreground">
                  Transfer workspace ownership to another member
                </p>
              </div>
              <AlertDialog
                open={transferDialogOpen}
                onOpenChange={(open) => {
                  setTransferDialogOpen(open);
                  if (!open) setNewOwnerId("");
                }}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full sm:w-auto"
                    variant="outline"
                    size="sm"
                    disabled={isTransferring}
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Transfer Ownership
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Transfer "{workspace?.name}"?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      The selected member becomes the Workspace Owner. You will
                      be demoted to Workspace Admin and can no longer delete the
                      workspace or transfer it again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="space-y-2 py-4">
                    <Label htmlFor="new-owner">New owner</Label>
                    <Select
                      value={newOwnerId}
                      onValueChange={setNewOwnerId}
                      disabled={membersLoading || isTransferring}
                    >
                      <SelectTrigger id="new-owner">
                        <SelectValue
                          placeholder={
                            membersLoading
                              ? "Loading members..."
                              : candidates.length === 0
                                ? "No other active members"
                                : "Select a member"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {candidates.map((m) => (
                          <SelectItem key={m.user_id} value={m.user_id}>
                            {m.user.name}{" "}
                            <span className="text-xs text-muted-foreground">
                              {m.user.email}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isTransferring}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        handleTransfer();
                      }}
                      disabled={!newOwnerId || isTransferring}
                    >
                      {isTransferring ? "Transferring..." : "Transfer"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Delete Workspace */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-destructive rounded-md">
              <div>
                <h4 className="text-sm font-medium">Delete Workspace</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this workspace and all its data
                </p>
              </div>
              <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full sm:w-auto"
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Workspace
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete "{workspace?.name}"?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will soft-delete the workspace. You'll have{" "}
                      <strong>30 days</strong> to recover it before permanent
                      deletion.
                      <br />
                      <br />
                      All associated data will be preserved during the recovery
                      period:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Generated content</li>
                        <li>Team members and their access</li>
                        <li>Settings and configurations</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="space-y-2 py-4">
                    <Label htmlFor="password-confirm">
                      Enter your password to confirm
                    </Label>
                    <div className="relative">
                      <Input
                        id="password-confirm"
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        value={passwordConfirmation}
                        onChange={(e) =>
                          setPasswordConfirmation(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && passwordConfirmation) {
                            handleDelete();
                          }
                        }}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => {
                        setPasswordConfirmation("");
                        setShowPassword(false);
                        setDeleteDialogOpen(false);
                      }}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={!passwordConfirmation || isDeleting}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete workspace"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </PermissionGuard>
      </CardContent>
    </Card>
  );
}
