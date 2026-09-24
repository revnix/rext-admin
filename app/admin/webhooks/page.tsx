"use client";

import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  RefreshCw,
  Webhook,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/page-layout";
import { AdminGuard } from "@/components/permission/admin-guard";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import type {
  WebhookEvent,
  WebhookStats,
} from "@/lib/api-client/admin-webhooks";
import { log } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

// ============================================================================
// WEBHOOK EVENT ROW COMPONENT
// ============================================================================

interface WebhookEventRowProps {
  event: WebhookEvent;
  onRetry: (eventId: string) => void;
  retrying: boolean;
}

function WebhookEventRow({ event, onRetry, retrying }: WebhookEventRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [payload, setPayload] = useState<Record<string, unknown> | null>(
    (event.payload as Record<string, unknown> | null) ?? null,
  );
  const [payloadLoading, setPayloadLoading] = useState(false);
  const [payloadError, setPayloadError] = useState<string | null>(null);

  const toggleExpanded = async () => {
    const next = !isExpanded;
    setIsExpanded(next);
    if (next && payload === null && !payloadLoading) {
      try {
        setPayloadLoading(true);
        setPayloadError(null);
        const detail = await apiClient.adminWebhooks.getEventDetail(event.id);
        setPayload((detail.payload as Record<string, unknown> | null) ?? null);
      } catch (_err) {
        setPayloadError("Unable to load webhook payload.");
      } finally {
        setPayloadLoading(false);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Processed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <TableRow
        className={
          event.status === "failed"
            ? "bg-red-50/80 transition-colors hover:bg-red-100/90 dark:bg-red-950/20 dark:hover:bg-red-950/30"
            : "hover:bg-muted/50"
        }
      >
        <TableCell className="font-medium">{event.event_name}</TableCell>
        <TableCell>{getStatusBadge(event.status)}</TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(event.created_at), {
            addSuffix: true,
          })}
        </TableCell>
        <TableCell className="text-sm">
          {event.processed_at
            ? formatDistanceToNow(new Date(event.processed_at), {
                addSuffix: true,
              })
            : "-"}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleExpanded}>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            {event.status === "failed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRetry(event.id)}
                disabled={retrying}
              >
                <RefreshCw
                  className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`}
                />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={5} className="bg-gray-50 dark:bg-gray-800">
            <div className="space-y-4 p-4">
              {/* Event Details */}
              <div>
                <h4 className="font-semibold mb-2">Event Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Event ID:</span>{" "}
                    {event.event_id}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(event.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {event.error_message && (
                <div>
                  <h4 className="font-semibold mb-2 text-red-600">Error</h4>
                  <pre className="bg-red-100 p-3 rounded text-sm text-red-800 overflow-x-auto">
                    {event.error_message}
                  </pre>
                </div>
              )}

              {/* Payload viewer (redacted by the backend) */}
              <div>
                <h4 className="font-semibold mb-2">Payload</h4>
                {payloadLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : payloadError ? (
                  <p className="text-sm text-red-600">{payloadError}</p>
                ) : payload && Object.keys(payload).length > 0 ? (
                  <pre className="bg-white dark:bg-gray-800 p-3 rounded border text-xs overflow-x-auto max-h-64">
                    {JSON.stringify(payload, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No payload data available for this event.
                  </p>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ============================================================================
// STATISTICS CARDS
// ============================================================================

interface StatsCardsProps {
  stats: WebhookStats | null;
  loading: boolean;
}

function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {(["stats-1", "stats-2", "stats-3", "stats-4"] as const).map((id) => (
          <Card key={id}>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{stats.total_events ?? 0}</div>
          <p className="text-sm text-muted-foreground">Total Events</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-green-600">
            {stats.processed_events ?? 0}
          </div>
          <p className="text-sm text-muted-foreground">Processed</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-red-600">
            {stats.failed_events ?? 0}
          </div>
          <p className="text-sm text-muted-foreground">Failed</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">
            {typeof stats.success_rate === "number"
              ? stats.success_rate.toFixed(1)
              : "0.0"}
            %
          </div>
          <p className="text-sm text-muted-foreground">Success Rate</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WebhookMonitoringPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 50,
    total: 0,
    total_pages: 0,
  });

  // Filters
  const [eventNameFilter, setEventNameFilter] = useState<string>("");
  const [periodDays, setPeriodDays] = useState<number | undefined>(7);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<
    "all" | "processed" | "pending" | "failed"
  >("all");

  // Monotonic request id — guards against out-of-order responses overwriting
  // fresher state when filters change rapidly.
  const fetchSeq = useRef(0);

  // Tab counts come from ONE authoritative source (the stats endpoint), never
  // from the per-page event list, so they stay stable across tab switches and
  // satisfy processed + pending + failed === total.
  const tabCounts = {
    total: stats?.total_events ?? 0,
    processed: stats?.processed_events ?? 0,
    failed: stats?.failed_events ?? 0,
    pending:
      stats?.pending_events ??
      Math.max(
        (stats?.total_events ?? 0) -
          (stats?.processed_events ?? 0) -
          (stats?.failed_events ?? 0),
        0,
      ),
  };

  // Retry state
  const [retryingEventId, setRetryingEventId] = useState<string | null>(null);
  const [showRetryDialog, setShowRetryDialog] = useState(false);
  const [eventToRetry, setEventToRetry] = useState<string | null>(null);

  // Fetch events — the active tab drives a server-side status filter, so the
  // list and its pagination always reflect the full matching dataset (not a
  // client-side slice of the first page).
  const fetchEvents = useCallback(async () => {
    const seq = ++fetchSeq.current;
    try {
      setLoading(true);

      let start_date: string | undefined;
      if (periodDays !== undefined) {
        const d = new Date();
        d.setDate(d.getDate() - periodDays);
        start_date = d.toISOString();
      }

      const response = await apiClient.adminWebhooks.getEvents({
        page: currentPage,
        per_page: 50,
        event_name: eventNameFilter || undefined,
        status: activeTab,
        start_date,
      });

      // Ignore a response that a newer request has already superseded.
      if (seq !== fetchSeq.current) return;

      setEvents(response.events);
      setPagination(response.pagination);
    } catch (_error) {
      if (seq === fetchSeq.current) {
        toast.error("Failed to load webhook events. Please try again.");
      }
    } finally {
      if (seq === fetchSeq.current) setLoading(false);
    }
  }, [activeTab, currentPage, eventNameFilter, periodDays]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await apiClient.adminWebhooks.getStats(periodDays);
      setStats(statsData);
    } catch (error) {
      log.error("Failed to load webhook stats", error, {
        component: "AdminWebhooksPage",
        action: "fetchStats",
      });

      toast.error("Webhook summary is temporarily unavailable.");
    }
  }, [periodDays]);

  // Retry webhook
  const handleRetryWebhook = async (eventId: string) => {
    setEventToRetry(eventId);
    setShowRetryDialog(true);
  };

  const confirmRetry = async () => {
    if (!eventToRetry) return;

    try {
      setRetryingEventId(eventToRetry);
      const result = await apiClient.adminWebhooks.retryWebhook(eventToRetry);

      // The backend only resolves successfully when the event was actually
      // reprocessed; still guard against an application-level failure flag.
      if (result && result.success === false) {
        toast.error(result.message || "Webhook reprocessing failed.");
      } else {
        toast.success(result?.message || "Webhook reprocessed successfully.");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to retry webhook. Please try again.";
      toast.error(errorMessage);
    } finally {
      // Always re-sync monitoring data so the displayed status matches the
      // backend state, regardless of retry outcome.
      await Promise.all([fetchEvents(), fetchStats()]);
      setRetryingEventId(null);
      setShowRetryDialog(false);
      setEventToRetry(null);
    }
  };

  // Load events + stats together on any filter/tab/page change.
  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, [fetchEvents, fetchStats]);

  // The server already returns exactly the rows for the active tab.
  const filteredEvents = events;

  return (
    <AdminGuard superAdminOnly={true}>
      <PageLayout
        title="Webhook Monitoring"
        description="Monitor and manage webhook events from LemonSqueezy"
        actions={
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              fetchEvents();
              fetchStats();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      >
        {/* Statistics */}
        <StatsCards stats={stats} loading={loading && !stats} />

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label
                  htmlFor="event-name-filter"
                  className="text-sm font-medium mb-2 block"
                >
                  Event Name
                </label>
                <Input
                  id="event-name-filter"
                  className="!h-10"
                  placeholder="Filter by event name..."
                  value={eventNameFilter}
                  onChange={(e) => {
                    setEventNameFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="w-full sm:w-48">
                <label
                  htmlFor="period-filter"
                  className="text-sm font-medium mb-2 block"
                >
                  Time Period
                </label>
                <Select
                  value={periodDays?.toString() || "all"}
                  onValueChange={(value) => {
                    setPeriodDays(value === "all" ? undefined : Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last 24 hours</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Table with Tabs */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Webhook Events</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value as typeof activeTab);
                setCurrentPage(1);
              }}
            >
              <TabsList>
                <TabsTrigger value="all">
                  All Events ({tabCounts.total})
                </TabsTrigger>
                <TabsTrigger value="failed">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Failed ({tabCounts.failed})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending ({tabCounts.pending})
                </TabsTrigger>
                <TabsTrigger value="processed">
                  Processed ({tabCounts.processed})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {loading ? (
                  <div className="space-y-2">
                    {(
                      [
                        "event-skeleton-1",
                        "event-skeleton-2",
                        "event-skeleton-3",
                        "event-skeleton-4",
                        "event-skeleton-5",
                      ] as const
                    ).map((id) => (
                      <Skeleton key={id} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No webhook events found
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Processed</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEvents.map((event) => (
                          <WebhookEventRow
                            key={event.id}
                            event={event}
                            onRetry={handleRetryWebhook}
                            retrying={retryingEventId === event.id}
                          />
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {pagination.total_pages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Page {pagination.page} of {pagination.total_pages} (
                          {pagination.total} total)
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === pagination.total_pages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Retry Confirmation Dialog */}
        <AlertDialog open={showRetryDialog} onOpenChange={setShowRetryDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Retry Webhook</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to retry processing this webhook event?
                This will attempt to reprocess the event with the original
                payload.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRetry}>
                Retry Webhook
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageLayout>
    </AdminGuard>
  );
}
