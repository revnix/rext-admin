"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CanAccess } from "@/components/permissions/can-access";
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
        "The workspace has been deleted. You have 30 days to recover it.",
      );

      setDeleteDialogOpen(false);
      setPasswordConfirmation("");
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
        <CanAccess
          permission={WORKSPACE_PERMISSIONS.DELETE}
          fallback={
            <p className="text-sm text-muted-foreground">
              Only workspace owners can delete the workspace.
            </p>
          }
        >
          <div className="space-y-4">
            {/* Transfer Ownership - Future Feature */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="text-sm font-medium">Transfer Ownership</h4>
                <p className="text-sm text-muted-foreground">
                  Transfer workspace ownership to another member
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>

            {/* Delete Workspace */}
            <div className="flex items-center justify-between p-4 border border-destructive rounded-lg">
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
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
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
                        <li>Knowledge bases and content</li>
                        <li>Topics and generations</li>
                        <li>Team members and their access</li>
                        <li>Settings and configurations</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="space-y-2 py-4">
                    <Label htmlFor="password-confirm">
                      Enter your password to confirm
                    </Label>
                    <Input
                      id="password-confirm"
                      type="password"
                      placeholder="Your password"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && passwordConfirmation) {
                          handleDelete();
                        }
                      }}
                    />
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => {
                        setPasswordConfirmation("");
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
        </CanAccess>
      </CardContent>
    </Card>
  );
}
