"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Clock,
  Loader2,
  LogOut,
  MapPin,
  Monitor,
  Shield,
  ShieldAlert,
  Smartphone,
  Tablet,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SecurityOverview } from "@/components/security/security-overview";
import { UnifiedActivity } from "@/components/security/unified-activity";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsAdmin } from "@/hooks/use-permission";
import { apiClient } from "@/lib/api-client";
import { userSessionsQueryOptions } from "@/lib/query-options/user-sessions";
import { formatSecurityDate } from "@/lib/formatters/security-date";

export default function SecuritySettingsPage() {
  const queryClient = useQueryClient();
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null,
  );
  const isAdmin = useIsAdmin();

  // Fetch sessions with auto-refresh every 30 seconds
  const {
    data: sessionData,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useQuery(userSessionsQueryOptions(30000));

  // Fetch security stats (admin only)
  const {
    data: securityStats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["security-stats"],
    queryFn: () => apiClient.security.getStats(),
    enabled: isAdmin,
    refetchInterval: 60000, // Refresh every minute
  });

  // Revoke single session mutation
  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => apiClient.sessions.revoke(sessionId),
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
    mutationFn: () => apiClient.sessions.revokeAll(),
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
    return formatSecurityDate(date);
  };

  if (sessionsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (sessionsError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">
            Failed to load sessions: {sessionsError.message}
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

      {/* Admin Security Statistics */}
      {isAdmin &&
        (statsLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32" />
            </CardContent>
          </Card>
        ) : statsError ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                Failed to load security statistics: {statsError.message}
              </p>
            </CardContent>
          </Card>
        ) : securityStats ? (
          <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20 overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-orange-600" />
                Security Dashboard (Admin)
              </CardTitle>
              <CardDescription>
                System-wide security metrics and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Failed Logins */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <p className="text-sm font-medium">Failed Logins</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {securityStats.failed_logins_last_24h}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        last 24h
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {securityStats.failed_logins_last_7d} in 7 days •{" "}
                      {securityStats.failed_logins_last_30d} in 30 days
                    </p>
                  </div>
                </div>

                {/* Locked Accounts */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-orange-600" />
                    <p className="text-sm font-medium">Locked Accounts</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {securityStats.currently_locked_accounts}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        currently
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {securityStats.locked_accounts_last_24h} locked today
                    </p>
                  </div>
                </div>

                {/* Password Activity */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium">Password Activity</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {securityStats.password_resets_last_24h} resets •{" "}
                      {securityStats.password_changes_last_24h} changes
                    </p>
                    <p className="text-xs text-muted-foreground">
                      last 24 hours
                    </p>
                  </div>
                </div>

                {/* New Accounts */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium">New Accounts</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {securityStats.new_registrations_last_24h}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        today
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {securityStats.email_verifications_last_24h} verified
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Offenders */}
              {((securityStats.top_failed_login_ips?.length ?? 0) > 0 ||
                (securityStats.top_failed_login_users?.length ?? 0) > 0) && (
                <>
                  <Separator className="my-4" />
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Top IPs */}
                    {(securityStats.top_failed_login_ips?.length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          Top Failed Login IPs
                        </p>
                        <div className="space-y-1">
                          {(securityStats.top_failed_login_ips || []).map(
                            (item) => (
                              <div
                                key={item.ip}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="font-mono">{item.ip}</span>
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  {item.count} attempts
                                </Badge>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {/* Top Users */}
                    {(securityStats.top_failed_login_users?.length ?? 0) >
                      0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          Top Failed Login Users
                        </p>
                        <div className="space-y-1">
                          {(securityStats.top_failed_login_users || []).map(
                            (item) => (
                              <div
                                key={item.email}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="truncate">{item.email}</span>
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  {item.count} attempts
                                </Badge>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : null)}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap shrink-0">
          <TabsTrigger value="overview" className="min-w-fit">
            Overview
          </TabsTrigger>
          <TabsTrigger value="sessions" className="min-w-fit">
            Sessions
          </TabsTrigger>
          <TabsTrigger value="activity" className="min-w-fit">
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <SecurityOverview />
        </TabsContent>

        {/* Active Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>
                    {sessionData?.sessions?.length || 0} active sessions across
                    all devices
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
                            {currentSession.device_name ?? "Unknown Device"}
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
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
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
                            {formatTimestamp(
                              currentSession.last_activity_at || "",
                            )}
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
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="rounded-full bg-muted p-2">
                              {getDeviceIcon(session.device_type)}
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium">
                                {session.device_name ?? "Unknown Device"}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {session.ip_address && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {session.ip_address}
                                  </span>
                                )}
                                {(session.city || session.country) && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
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
                                  {formatTimestamp(
                                    session.last_activity_at || "",
                                  )}
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
        </TabsContent>

        {/* Activity Tab - Unified login history and activity log */}
        <TabsContent value="activity">
          <UnifiedActivity />
        </TabsContent>
      </Tabs>
    </div>
  );
}
