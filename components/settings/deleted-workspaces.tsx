"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { SettingsGroup } from "./settings-group";

interface DeletedWorkspaceRow {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  timezone: string | null;
  url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  recovery_deadline: string;
  days_remaining: number;
}

/** How long the backend keeps a deleted workspace restorable (workspace_service.py). */
const RECOVERY_DAYS = 30;

function days(n: number) {
  return `${n} day${n === 1 ? "" : "s"}`;
}

/**
 * The account's trash, in Data and trash: the workspaces deleted in the last 30 days, each restored
 * or deleted for good (the typed name first). The one trash component for workspaces and accounts is
 * D13's; this keeps the list as it was.
 */
export function DeletedWorkspaces() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [restoringWorkspaceId, setRestoringWorkspaceId] = useState<
    string | null
  >(null);
  const [purgeTarget, setPurgeTarget] = useState<DeletedWorkspaceRow | null>(
    null,
  );
  const [purgeConfirmation, setPurgeConfirmation] = useState("");
  const [isPurging, setIsPurging] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["deleted-workspaces"],
    queryFn: () => apiClient.workspaces.getDeleted(),
    staleTime: 30_000,
  });

  const workspaces = useMemo<DeletedWorkspaceRow[]>(() => {
    return data?.workspaces ?? [];
  }, [data]);

  const handleRestore = async (workspace: DeletedWorkspaceRow) => {
    setRestoringWorkspaceId(workspace.id);
    try {
      await apiClient.workspaces.restore(workspace.id);
      toast.success(`"${workspace.name}" was restored`);
      await queryClient.invalidateQueries({ queryKey: ["deleted-workspaces"] });
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      await refetch();
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The workspace couldn't be restored";
      toast.error(message);
    } finally {
      setRestoringWorkspaceId(null);
    }
  };

  const closePurgeDialog = () => {
    if (isPurging) return;
    setPurgeTarget(null);
    setPurgeConfirmation("");
  };

  const handlePurge = async () => {
    if (!purgeTarget || purgeConfirmation.trim() !== purgeTarget.name.trim()) {
      return;
    }

    setIsPurging(true);
    try {
      await apiClient.workspaces.deletePermanently(purgeTarget.id);
      toast.success(`"${purgeTarget.name}" was deleted for good`);
      setPurgeTarget(null);
      setPurgeConfirmation("");
      await queryClient.invalidateQueries({ queryKey: ["deleted-workspaces"] });
      await refetch();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The workspace couldn't be deleted";
      toast.error(message);
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <SettingsGroup
      title="Trash"
      description={`Workspaces you deleted in the last ${RECOVERY_DAYS} days. Restore one, or delete it for good.`}
      action={
        <Button
          variant="outline"
          size="icon"
          onClick={() => void refetch()}
          disabled={isLoading || isFetching}
          aria-label="Refresh the trash"
        >
          <RefreshCw className={isFetching ? "animate-spin" : undefined} />
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : workspaces.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nothing in the trash.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {workspaces.map((workspace) => {
            const deletedDaysAgo = Math.max(
              0,
              RECOVERY_DAYS - workspace.days_remaining,
            );
            const restoring = restoringWorkspaceId === workspace.id;

            return (
              <li
                key={workspace.id}
                className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="truncate font-medium">{workspace.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Deleted{" "}
                    {deletedDaysAgo === 0
                      ? "today"
                      : `${days(deletedDaysAgo)} ago`}
                    ; {days(workspace.days_remaining)} left to restore it
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleRestore(workspace)}
                    disabled={restoring}
                  >
                    {restoring ? (
                      <Loader2 className="animate-spin" aria-hidden />
                    ) : (
                      <RotateCcw aria-hidden />
                    )}
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setPurgeConfirmation("");
                      setPurgeTarget(workspace);
                    }}
                    disabled={restoring}
                  >
                    Delete for good
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog
        open={purgeTarget !== null}
        onOpenChange={(open) => {
          if (!open) closePurgeDialog();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete "{purgeTarget?.name}" for good?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Everything in it goes: articles, personas, the brand voice and its
              connections. It can't be restored afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="purge-confirmation">
              Type <span className="font-mono">{purgeTarget?.name}</span> to
              confirm
            </Label>
            <Input
              id="purge-confirmation"
              value={purgeConfirmation}
              onChange={(event) => setPurgeConfirmation(event.target.value)}
              autoComplete="off"
              disabled={isPurging}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPurging}>
              Keep it in the trash
            </AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={(event) => {
                event.preventDefault();
                void handlePurge();
              }}
              disabled={
                isPurging ||
                purgeConfirmation.trim() !== (purgeTarget?.name.trim() ?? "")
              }
            >
              {isPurging && <Loader2 className="animate-spin" aria-hidden />}
              Delete for good
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsGroup>
  );
}
