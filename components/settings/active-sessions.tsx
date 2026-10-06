"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Monitor, Smartphone, Tablet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
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
  return <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />;
}

function lastActive(timestamp: string | null | undefined) {
  if (!timestamp) return "Activity unknown";
  const date = new Date(timestamp);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Active just now";
  if (minutes < 60) return `Active ${minutes} min ago`;
  if (minutes < 1440) return `Active ${Math.floor(minutes / 60)} h ago`;
  return `Active ${formatSecurityDate(date)}`;
}

function SessionRow({
  session,
  action,
}: {
  session: Session;
  action?: React.ReactNode;
}) {
  const place = [session.city, session.country].filter(Boolean).join(", ");
  const facts = [
    session.ip_address,
    place,
    lastActive(session.last_activity_at),
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <li className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <DeviceIcon type={session.device_type} />
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">
              {session.device_name ?? "Unknown device"}
            </p>
            {session.is_current && <Badge variant="neutral">This device</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{facts}</p>
        </div>
      </div>
      {action}
    </li>
  );
}

/** The other devices shown before "Show all": the most recently active first. */
const FIRST_SHOWN = 5;

/**
 * The devices signed in to the account, this one first, each of the others signed out on its own or
 * all at once. Refreshed every 30 seconds. An account can hold hundreds, so five show until the
 * person asks for all; D8 puts it on the DataTable.
 */
export function ActiveSessions() {
  const queryClient = useQueryClient();
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null,
  );
  const [showAll, setShowAll] = useState(false);

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

  const sessions = sessionData?.sessions || [];
  const currentSession = sessions.find((s) => s.is_current);
  const otherSessions = sessions
    .filter((s) => !s.is_current)
    .sort((a, b) =>
      (b.last_activity_at ?? "").localeCompare(a.last_activity_at ?? ""),
    );
  const shownSessions = showAll
    ? otherSessions
    : otherSessions.slice(0, FIRST_SHOWN);

  return (
    <SettingsGroup
      title="Sessions"
      description="The devices signed in to your account. Sign out of one you don't recognise, then change your password."
      action={
        otherSessions.length > 0 && (
          <Button
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
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : error ? (
        <Notice
          tone="danger"
          title="Your sessions didn't load"
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          }
        >
          {error.message}
        </Notice>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sessions found.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {currentSession && <SessionRow session={currentSession} />}
          {shownSessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeMutation.mutate(session.id)}
                  disabled={revokingSessionId === session.id}
                >
                  {revokingSessionId === session.id && (
                    <Loader2 className="animate-spin" aria-hidden />
                  )}
                  Sign out
                </Button>
              }
            />
          ))}
        </ul>
      )}
      {otherSessions.length > FIRST_SHOWN && (
        <Button
          variant="ghost"
          className="self-start"
          onClick={() => setShowAll((all) => !all)}
        >
          {showAll
            ? "Show fewer"
            : `Show all ${otherSessions.length} other devices`}
        </Button>
      )}
    </SettingsGroup>
  );
}
