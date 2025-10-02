"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Loader2,
  LogOut,
  MapPin,
  Monitor,
  Shield,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SessionApiService } from "@/services/session-api";

export default function SecuritySettingsPage() {
  const queryClient = useQueryClient();
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null,
  );

  // Fetch sessions with auto-refresh every 30 seconds
  const {
    data: sessionData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user-sessions"],
    queryFn: () => SessionApiService.listSessions(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Revoke single session mutation
  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) =>
      SessionApiService.revokeSession(sessionId),
    onMutate: (sessionId) => {
      setRevokingSessionId(sessionId);
    },
    onSuccess: () => {
      toast.success("Session revoked successfully");
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
    },
    onError: (error) => {
      toast.error(`Failed to revoke session: ${error.message}`);
    },
    onSettled: () => {
      setRevokingSessionId(null);
    },
  });

  // Revoke all sessions mutation
  const revokeAllMutation = useMutation({
    mutationFn: () => SessionApiService.revokeAllSessions(),
    onSuccess: (data) => {
      toast.success(`Logged out from ${data.revoked_count} devices`);
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
    },
    onError: (error) => {
      toast.error(`Failed to revoke sessions: ${error.message}`);
    },
  });

  const getDeviceIcon = (deviceType: string | null) => {
    if (deviceType === "mobile") return <Smartphone className="h-5 w-5" />;
    if (deviceType === "tablet") return <Tablet className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">
            Failed to load sessions: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  const sessions = sessionData?.sessions || [];
  const currentSession = sessions.find((s) => s.is_current);
  const otherSessions = sessions.filter((s) => !s.is_current);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Security</h2>
        <p className="text-muted-foreground">
          Manage your active sessions and monitor account activity
        </p>
      </div>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                {sessionData?.active_count || 0} active sessions across all
                devices
              </CardDescription>
            </div>
            {otherSessions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => revokeAllMutation.mutate()}
                disabled={revokeAllMutation.isPending}
              >
                {revokeAllMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout All Other Devices
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Session */}
          {currentSession && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    {getDeviceIcon(currentSession.device_type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {currentSession.device_name || "Unknown Device"}
                      </p>
                      <Badge variant="default">Current Session</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {currentSession.ip_address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {currentSession.ip_address}
                        </span>
                      )}
                      {(currentSession.city || currentSession.country) && (
                        <span>
                          {[currentSession.city, currentSession.country]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        Last active:{" "}
                        {formatTimestamp(currentSession.last_activity_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Sessions */}
          {otherSessions.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                {otherSessions.map((session) => (
                  <div key={session.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-muted p-2">
                          {getDeviceIcon(session.device_type)}
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {session.device_name || "Unknown Device"}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {session.ip_address && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {session.ip_address}
                              </span>
                            )}
                            {(session.city || session.country) && (
                              <span>
                                {[session.city, session.country]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              Last active:{" "}
                              {formatTimestamp(session.last_activity_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeMutation.mutate(session.id)}
                        disabled={revokingSessionId === session.id}
                      >
                        {revokingSessionId === session.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Revoke"
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {sessions.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No active sessions found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Activity Log - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <CardDescription>
            Recent account activity and security events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              Activity log requires backend audit logging (Phase 6)
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Will display login attempts, password changes, and security events
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
