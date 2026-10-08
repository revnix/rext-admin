"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOut, Monitor, Smartphone, Tablet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableRowAction,
  UNKNOWN,
} from "@/components/ui/data-table";
import { apiClient } from "@/lib/api-client";
import { formatSecurityDate } from "@/lib/formatters/security-date";
import { userSessionsQueryOptions } from "@/lib/query-options/user-sessions";
import { SettingsGroup } from "./settings-group";

type Session = NonNullable<
  Awaited<ReturnType<typeof apiClient.sessions.list>>["sessions"]
>[number];

function DeviceIcon({ type }: { type: string | null }) {
  const Icon =
    type === "mobile" ? Smartphone : type === "tablet" ? Tablet : Monitor;
  return <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />;
}

function lastActive(timestamp: string | null | undefined) {
  if (!timestamp) return "Unknown";
  const date = new Date(timestamp);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} h ago`;
  return formatSecurityDate(date);
}

function placeOf(session: Session) {
  const place = [session.city, session.country].filter(Boolean).join(", ");
  return [session.ip_address, place].filter(Boolean).join(" · ");
}

function DeviceName({ session }: { session: Session }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <DeviceIcon type={session.device_type} />
      <span className="truncate font-medium text-foreground">
        {session.device_name ?? "Unknown device"}
      </span>
      {session.is_current && <Badge variant="neutral">This device</Badge>}
    </span>
  );
}

const column = createDataTableColumnHelper<Session>();

// This device first, then the rest by their last activity: the order is the list's, not a sort.
const columns = column.columns([
  column.accessor((session) => session.device_name ?? "", {
    id: "device",
    header: "Device",
    cell: ({ row }) => <DeviceName session={row.original} />,
    enableSorting: false,
    enableHiding: false,
  }),
  column.accessor((session) => placeOf(session), {
    id: "where",
    header: "Where",
    cell: ({ getValue }) => (
      <span className="num">{getValue() || UNKNOWN}</span>
    ),
    enableSorting: false,
  }),
  column.accessor("last_activity_at", {
    header: "Last active",
    meta: { align: "end" },
    cell: ({ getValue }) => lastActive(getValue()),
    enableSorting: false,
  }),
]);

/**
 * The devices signed in to the account (D8, plans/app/D-pages.md §2.8), this one first, then by
 * their last activity, 25 a page: an account can hold hundreds. Each of the others is signed out
 * from its row's menu, or all of them at once. Refreshed every 30 seconds.
 */
export function ActiveSessions() {
  const queryClient = useQueryClient();
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null,
  );

  const {
    data: sessionData,
    isLoading,
    error,
    refetch,
  } = useQuery(userSessionsQueryOptions(30000));

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => apiClient.sessions.revoke(sessionId),
    onMutate: (sessionId) => {
      setRevokingSessionId(sessionId);
    },
    onSuccess: () => {
      toast.success("That device was signed out");
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
    },
    onError: (revokeError) => {
      toast.error(`The device couldn't be signed out: ${revokeError.message}`);
    },
    onSettled: () => {
      setRevokingSessionId(null);
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => apiClient.sessions.revokeAll(),
    onSuccess: (data) => {
      toast.success(
        `Signed out of ${data.revoked_count} other device${data.revoked_count === 1 ? "" : "s"}`,
      );
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
    },
    onError: (revokeError) => {
      toast.error(`The devices couldn't be signed out: ${revokeError.message}`);
    },
  });

  const sessions = useMemo(() => {
    const all = sessionData?.sessions ?? [];
    const others = all
      .filter((session) => !session.is_current)
      .sort((a, b) =>
        (b.last_activity_at ?? "").localeCompare(a.last_activity_at ?? ""),
      );
    return [...all.filter((session) => session.is_current), ...others];
  }, [sessionData]);
  const others = sessions.filter((session) => !session.is_current).length;

  const rowActions = (session: Session): DataTableRowAction[] =>
    session.is_current
      ? []
      : [
          {
            label: "Sign out",
            icon: LogOut,
            onSelect: () => revokeMutation.mutate(session.id),
            disabled:
              revokingSessionId === session.id ? "Signing out…" : undefined,
          },
        ];

  return (
    <SettingsGroup
      title="Sessions"
      description="The devices signed in to your account. Sign out of one you don't recognise, then change your password."
      action={
        others > 0 && (
          <Button
            data-rec="show"
            variant="outline"
            onClick={() => revokeAllMutation.mutate()}
            disabled={revokeAllMutation.isPending}
          >
            {revokeAllMutation.isPending && (
              <Loader2 className="animate-spin" aria-hidden />
            )}
            Sign out of other devices
          </Button>
        )
      }
    >
      <DataTable
        caption="Devices signed in to your account"
        columns={columns}
        data={sessions}
        getRowId={(session) => session.id}
        getRowLabel={(session) =>
          session.is_current
            ? "This device"
            : (session.device_name ?? "Unknown device")
        }
        isLoading={isLoading}
        skeletonRows={3}
        error={
          error ? (
            <div className="flex flex-col items-center gap-3">
              <p>Your sessions didn't load.</p>
              <Button
                data-rec="show"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                Try again
              </Button>
            </div>
          ) : undefined
        }
        emptyState={
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No sessions found.
          </p>
        }
        rowActions={rowActions}
        renderCard={(session, { actions }) => (
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <DeviceName session={session} />
              <p className="text-sm text-muted-foreground">
                {[placeOf(session), lastActive(session.last_activity_at)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            {actions}
          </div>
        )}
      />
    </SettingsGroup>
  );
}
