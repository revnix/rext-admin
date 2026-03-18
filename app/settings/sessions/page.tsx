"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Laptop,
  LogOut,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorPage } from "@/components/ui/error-states";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import { userSessionsQueryOptions } from "@/lib/query-options/user-sessions";

import type { UserSession } from "@/types/user-session";

export default function SessionsPage() {
  const [sessionToRevoke, setSessionToRevoke] = useState<UserSession | null>(
    null,
  );
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch sessions
  const { data, isLoading, error, refetch } = useQuery(
    userSessionsQueryOptions(),
  );

  // Revoke single session
  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => apiClient.users.revokeSession(sessionId),
    onSuccess: () => {
      toast.success("Session terminated successfully");
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
      setSessionToRevoke(null);
    },
    onError: (error: Error) => {
      log.error("Failed to revoke session:", error);
      toast.error("Failed to terminate session");
    },
  });

  // Revoke all other sessions
  const revokeAllMutation = useMutation({
    mutationFn: () => apiClient.users.revokeAllOtherSessions(),
    onSuccess: () => {
      toast.success("All other sessions terminated successfully");
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
      setShowRevokeAllDialog(false);
    },
    onError: (error: Error) => {
      log.error("Failed to revoke all sessions:", error);
      toast.error("Failed to terminate all sessions");
    },
  });

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="h-5 w-5" />;
      case "tablet":
        return <Tablet className="h-5 w-5" />;
      case "desktop":
        return <Monitor className="h-5 w-5" />;
      default:
        return <Laptop className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (error) {
    return (
      <ErrorPage
        title="Failed to load sessions"
        message="There was an error loading your active sessions. Please try again."
        retry={() => refetch()}
      />
    );
  }

  const sessions = data?.sessions || [];
  const currentSession = sessions.find((s) => s.is_current);
  const otherSessions = sessions.filter((s) => !s.is_current);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Active Sessions</h2>
        <p className="text-muted-foreground mt-1">
          Manage your active sessions across all devices
        </p>
      </div>
      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            About Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p>
            Sessions represent your active logins across different devices and
            browsers. You can logout from specific devices for security.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Your current session is highlighted below</li>
            <li>Logging out from a session requires re-login on that device</li>
            <li>Sessions expire automatically after 30 days of inactivity</li>
            <li>Changing your password terminates all sessions</li>
          </ul>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Sessions
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.active_count || 0}</div>
            <p className="text-xs text-muted-foreground">Currently logged in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Other Devices</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{otherSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Devices besides this one
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Session */}
      {currentSession && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle>Current Session</CardTitle>
            <CardDescription>
              This is the device you're using right now
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="mt-1 text-green-600 dark:text-green-400">
                {getDeviceIcon(currentSession.device_type ?? null)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{currentSession.device_name}</p>
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/30 dark:text-green-400">
                    Current
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  IP: {currentSession.ip_address || "Unknown"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Active since: {formatDate(currentSession.created_at)}
                </p>
                {currentSession.last_activity_at && (
                  <p className="text-sm text-muted-foreground">
                    Last active: {formatDate(currentSession.last_activity_at)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Other Sessions</CardTitle>
            <CardDescription>
              Sessions on other devices and browsers
            </CardDescription>
          </div>
          {otherSessions.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowRevokeAllDialog(true)}
              disabled={revokeAllMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout All Other Devices
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : otherSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Laptop className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No other active sessions</p>
              <p className="text-sm">You're only logged in on this device</p>
            </div>
          ) : (
            <div className="space-y-4">
              {otherSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-start gap-4 p-4 rounded-lg border"
                >
                  <div className="mt-1 text-muted-foreground">
                    {getDeviceIcon(session.device_type ?? null)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{session.device_name}</p>
                    <p className="text-sm text-muted-foreground">
                      IP: {session.ip_address || "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Active since: {formatDate(session.created_at)}
                    </p>
                    {session.last_activity_at && (
                      <p className="text-sm text-muted-foreground">
                        Last active: {formatDate(session.last_activity_at)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSessionToRevoke(session)}
                    disabled={revokeMutation.isPending}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Single Session Dialog */}
      <AlertDialog
        open={!!sessionToRevoke}
        onOpenChange={() => setSessionToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout from this device?</AlertDialogTitle>
            <AlertDialogDescription>
              This will terminate the session on{" "}
              <strong>{String(sessionToRevoke?.device_name)}</strong>. You'll
              need to login again on that device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                sessionToRevoke && revokeMutation.mutate(sessionToRevoke.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Logout Device
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke All Sessions Dialog */}
      <AlertDialog
        open={showRevokeAllDialog}
        onOpenChange={setShowRevokeAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout from all other devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will terminate all {otherSessions.length} other active
              sessions. You'll need to login again on those devices. Your
              current session will remain active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeAllMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Logout All Other Devices
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
