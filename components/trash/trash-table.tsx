"use client";

/**
 * The one trash table (D13): what was deleted, of which kind, when, and how long it stays
 * restorable, with Restore and Delete forever in each row's menu. Deleting forever is confirmed
 * first, by typing the item's name when the caller asks for it (a workspace takes everything in it
 * along). Its first use is the account's deleted workspaces (D13a); the workspace's articles and
 * personas follow on the same component (D13b, after the backend's trash, G45).
 *
 * @module components/trash/trash-table
 */

import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableRowAction,
  UNKNOWN,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { dateFormat } from "@/lib/formatters/date-formatters";

/** One deleted thing, as the trash shows it. */
export interface TrashItem {
  id: string;
  /** What the person knows it by: a workspace's name, an article's title. */
  name: string;
  /** Its kind, in words: "Workspace", "Article", "Persona". */
  kind: string;
  deletedAt: string;
  /** Days left before it's gone for good, when the backend says. */
  daysLeft?: number | null;
}

/** "Restorable for 1 more day", "Restorable for 12 more days", or nothing when unknown. */
export function restorableWords(
  daysLeft: number | null | undefined,
): string | null {
  if (daysLeft === null || daysLeft === undefined) return null;
  if (daysLeft <= 0) return "Goes for good today";
  return `Restorable for ${daysLeft} more day${daysLeft === 1 ? "" : "s"}`;
}

const column = createDataTableColumnHelper<TrashItem>();
const columns = column.columns([
  column.accessor("name", {
    header: "Item",
    cell: ({ getValue }) => (
      <span className="block truncate font-medium text-foreground">
        {getValue()}
      </span>
    ),
    enableSorting: false,
  }),
  column.accessor("kind", {
    header: "Kind",
    cell: ({ getValue }) => <Badge variant="neutral">{getValue()}</Badge>,
    enableSorting: false,
  }),
  column.accessor("deletedAt", {
    header: "Deleted",
    meta: { align: "end", numeric: true },
    cell: ({ row, getValue }) => (
      <span className="flex flex-col items-end">
        <span>{dateFormat.short(getValue()) || UNKNOWN}</span>
        {restorableWords(row.original.daysLeft) && (
          <span className="text-muted-foreground">
            {restorableWords(row.original.daysLeft)}
          </span>
        )}
      </span>
    ),
    enableSorting: false,
  }),
]);

export function TrashTable({
  caption,
  items,
  awaiting,
  error,
  onRetry,
  onRestore,
  onDeleteForever,
  deleteForeverWarning,
  emptyDescription,
  confirmByTypingName = false,
}: {
  /** The table's name for assistive technology: "Deleted workspaces". */
  caption: string;
  items: TrashItem[];
  /** Still waiting for the list (D16a's `awaitingData`): the skeleton, not the empty state. */
  awaiting: boolean;
  error: Error | null;
  onRetry: () => void;
  onRestore: (item: TrashItem) => Promise<void>;
  onDeleteForever: (item: TrashItem) => Promise<void>;
  /** What goes along when this item is deleted for good, for the confirmation. */
  deleteForeverWarning: (item: TrashItem) => ReactNode;
  /** The empty state's one sentence: what lands in this trash, and for how long. */
  emptyDescription?: ReactNode;
  /** Ask for the item's name before deleting it for good (a workspace: everything in it goes). */
  confirmByTypingName?: boolean;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [target, setTarget] = useState<TrashItem | null>(null);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  const restore = async (item: TrashItem) => {
    setBusyId(item.id);
    try {
      await onRestore(item);
    } finally {
      setBusyId(null);
    }
  };

  const closeConfirmation = () => {
    if (deleting) return;
    setTarget(null);
    setTyped("");
  };

  const named =
    !confirmByTypingName || typed.trim() === (target?.name.trim() ?? "");

  const deleteForever = async () => {
    if (!target || !named) return;
    setDeleting(true);
    setBusyId(target.id);
    try {
      await onDeleteForever(target);
      setTarget(null);
      setTyped("");
    } catch {
      // The caller said why; the confirmation stays open to try again or keep it.
    } finally {
      setDeleting(false);
      setBusyId(null);
    }
  };

  const rowActions = (item: TrashItem): DataTableRowAction[] => {
    const busy = busyId === item.id ? "Working on it…" : false;
    return [
      {
        label: "Restore",
        icon: RotateCcw,
        disabled: busy,
        onSelect: () => void restore(item),
      },
      {
        label: "Delete forever",
        icon: Trash2,
        destructive: true,
        disabled: busy,
        onSelect: () => {
          setTyped("");
          setTarget(item);
        },
      },
    ];
  };

  return (
    <>
      <DataTable
        caption={caption}
        columns={columns}
        data={items}
        getRowId={(item) => item.id}
        getRowLabel={(item) => item.name}
        isLoading={awaiting}
        skeletonRows={2}
        surface="card"
        cardsWhen="narrow"
        rowActions={rowActions}
        error={
          error ? (
            <Notice
              tone="danger"
              title="The trash didn't load"
              action={
                <Button size="sm" variant="outline" onClick={onRetry}>
                  Try again
                </Button>
              }
            >
              {error.message}
            </Notice>
          ) : undefined
        }
        emptyState={
          <EmptyState
            title="Nothing in the trash"
            description={emptyDescription}
            as="h3"
          />
        }
        renderCard={(item, { actions }) => (
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate font-medium text-foreground">
                {item.name}
              </span>
              <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="neutral">{item.kind}</Badge>
                <span className="num">
                  Deleted {dateFormat.short(item.deletedAt) || UNKNOWN}
                </span>
              </span>
              {restorableWords(item.daysLeft) && (
                <span className="text-sm text-muted-foreground">
                  {restorableWords(item.daysLeft)}
                </span>
              )}
            </div>
            {actions}
          </div>
        )}
      />

      <AlertDialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) closeConfirmation();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete "{target?.name}" for good?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {target ? deleteForeverWarning(target) : null} It can't be
              restored afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirmByTypingName && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="trash-confirm-name">
                Type <span className="font-mono">{target?.name}</span> to
                confirm
              </Label>
              <Input
                id="trash-confirm-name"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                autoComplete="off"
                disabled={deleting}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Keep it in the trash
            </AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={(event) => {
                event.preventDefault();
                void deleteForever();
              }}
              disabled={deleting || !named}
            >
              {deleting && <Loader2 className="animate-spin" aria-hidden />}
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
