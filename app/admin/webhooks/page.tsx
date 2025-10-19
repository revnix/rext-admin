"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Webhook,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import type {
  WebhookEvent,
  WebhookEventsResponse,
  WebhookStats,
} from "@/lib/api-client/admin-webhooks";

// ============================================================================
// TYPES
// ============================================================================

type StatusFilter = "all" | "processed" | "pending" | "failed";

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
      <TableRow className={event.status === "failed" ? "bg-red-50" : ""}>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
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
          <TableCell colSpan={5} className="bg-gray-50">
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

              {/* Payload */}
              <div>
                <h4 className="font-semibold mb-2">Payload</h4>
                <pre className="bg-white p-3 rounded border text-xs overflow-x-auto max-h-64">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
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
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
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
          <div className="text-2xl font-bold">{stats.total_events}</div>
          <p className="text-sm text-muted-foreground">Total Events</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-green-600">
            {stats.processed_events}
          </div>
          <p className="text-sm text-muted-foreground">Processed</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-red-600">
            {stats.failed_events}
          </div>
          <p className="text-sm text-muted-foreground">Failed</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">
            {stats.success_rate.toFixed(1)}%
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
  const { toast } = useToast();

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
  const [summary, setSummary] = useState({
    total: 0,
    processed: 0,
    pending: 0,
    failed: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [eventNameFilter, setEventNameFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");

  // Retry state
  const [retryingEventId, setRetryingEventId] = useState<string | null>(null);
  const [showRetryDialog, setShowRetryDialog] = useState(false);
  const [eventToRetry, setEventToRetry] = useState<string | null>(null);

  // Fetch events
  const fetchEvents = async () => {
    try {
      setLoading(true);

      let processedFilter: boolean | undefined = undefined;
      if (statusFilter === "processed") processedFilter = true;
      if (statusFilter === "pending" || statusFilter === "failed")
        processedFilter = false;

      const response = await apiClient.adminWebhooks.getEvents({
        page: currentPage,
        per_page: 50,
        event_name: eventNameFilter || undefined,
        processed: processedFilter,
      });

      setEvents(response.events);
      setPagination(response.pagination);
      setSummary(response.summary);
    } catch (error) {
      console.error("Failed to fetch webhook events:", error);
      toast({
        title: "Error",
        description: "Failed to load webhook events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const statsData = await apiClient.adminWebhooks.getStats();
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch webhook stats:", error);
    }
  };

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

      toast({
        title: "Success",
        description: result.message || "Webhook retry initiated successfully",
      });

      // Refresh events
      await fetchEvents();
    } catch (error: any) {
      console.error("Failed to retry webhook:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to retry webhook. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRetryingEventId(null);
      setShowRetryDialog(false);
      setEventToRetry(null);
    }
  };

  // Initial load
  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, []);

  // Reload on filter changes
  useEffect(() => {
    fetchEvents();
  }, [currentPage, statusFilter, eventNameFilter]);

  // Filter events based on tab
  const getFilteredEvents = () => {
    if (activeTab === "all") return events;
    if (activeTab === "failed")
      return events.filter((e) => e.status === "failed");
    if (activeTab === "pending")
      return events.filter((e) => e.status === "pending");
    if (activeTab === "processed")
      return events.filter((e) => e.status === "processed");
    return events;
  };

  const filteredEvents = getFilteredEvents();

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Webhook className="h-8 w-8" />
            Webhook Monitoring
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage webhook events from LemonSqueezy
          </p>
        </div>
        <Button
          onClick={() => {
            fetchEvents();
            fetchStats();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

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
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Event Name
              </label>
              <Input
                placeholder="Filter by event name..."
                value={eventNameFilter}
                onChange={(e) => {
                  setEventNameFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="w-48">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value: StatusFilter) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Events</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                All Events ({summary.total})
              </TabsTrigger>
              <TabsTrigger value="failed">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Failed ({summary.failed})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({summary.pending})
              </TabsTrigger>
              <TabsTrigger value="processed">
                Processed ({summary.processed})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
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
                <>
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
                </>
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
              Are you sure you want to retry processing this webhook event? This
              will attempt to reprocess the event with the original payload.
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
    </div>
  );
}
