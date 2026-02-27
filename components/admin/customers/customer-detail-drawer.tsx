"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  CreditCard,
  MessageSquare,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/error-states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import { ImpersonateButton } from "@/components/impersonation/impersonate-button";
import { CustomerActionsDropdown } from "./customer-actions-dropdown";
import { CustomerNotesTimeline } from "./customer-notes-timeline";

interface Workspace {
  id: string;
  name: string;
  created_at: string;
}

interface CustomerData {
  user: {
    id: string;
    email: string;
    full_name?: string;
    display_name?: string;
    status: string;
    is_active?: boolean;
    created_at: string;
    last_login?: string;
  };
  subscription?: {
    id: string;
    plan_name: string;
    status: string;
    billing_period?: string;
    current_period_start?: string;
    current_period_end?: string;
    start_date?: string;
    trial_end_date?: string;
    cancelled_at?: string;
    plan?: {
      price_monthly?: number;
    };
  };
  workspaces: Workspace[];
  notes: Array<{
    id: string;
    note: string;
    category: string;
    admin_email?: string;
    created_at: string;
  }>;
  usage?: {
    api_calls: number;
    storage_used_mb: number;
  };
  usage_stats?: {
    api_calls: number;
    storage_used_mb: number;
  };
  activity_summary?: Record<string, unknown>;
}

interface CustomerDetailDrawerProps {
  customerId: string;
  open: boolean;
  onClose: () => void;
}

export function CustomerDetailDrawer({
  customerId,
  open,
  onClose,
}: CustomerDetailDrawerProps) {
  const queryClient = useQueryClient();

  // Fetch customer details
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "customer", customerId],
    queryFn: async () => {
      return await apiClient
        .request<{ data: CustomerData }>(
          `/api/v1/admin/customers/${customerId}`,
        )
        .then((res) => res.data);
    },
    enabled: open && !!customerId,
  });

  if (error) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <div className="py-8">
            <ErrorAlert
              title="Failed to load customer details"
              message={
                error instanceof Error
                  ? error.message
                  : "An unexpected error occurred"
              }
              retry={() => void refetch()}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const customerData = data;
  const user = customerData?.user;
  const subscription = customerData?.subscription;
  const workspaces = customerData?.workspaces || [];
  const usage = customerData?.usage;
  const activitySummary = customerData?.activity_summary;
  const notes = customerData?.notes || [];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const handleActionComplete = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
    toast.success("Action completed successfully");
  };

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <div className="space-y-4 py-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>{user.display_name || user.email}</SheetTitle>
              <SheetDescription>{user.email}</SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <ImpersonateButton
                userId={user.id}
                userName={user.display_name || user.email}
                userEmail={user.email}
              />
              <CustomerActionsDropdown
                customerId={customerId}
                user={user}
                subscription={subscription || null}
                onActionComplete={handleActionComplete}
              />
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <User className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <CreditCard className="h-4 w-4 mr-2" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="usage">
              <BarChart3 className="h-4 w-4 mr-2" />
              Usage
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="notes">
              <MessageSquare className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">User ID</span>
                  <span className="text-sm font-mono">
                    {user.id.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Display Name
                  </span>
                  <span className="text-sm">
                    {user.display_name || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {user.is_active ? (
                    <Badge variant="default" className="bg-green-600">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">{formatDate(user.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Last Login
                  </span>
                  <span className="text-sm">
                    {formatDate(user.last_login || null)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workspaces ({workspaces.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {workspaces.length > 0 ? (
                  <div className="space-y-2">
                    {workspaces.map((workspace) => (
                      <div
                        key={workspace.id}
                        className="flex justify-between items-center p-2 rounded border"
                      >
                        <span className="text-sm font-medium">
                          {workspace.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(workspace.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No workspaces created yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-4">
            {subscription ? (
              <Card>
                <CardHeader>
                  <CardTitle>Current Subscription</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <span className="text-sm font-medium">
                      {subscription.plan_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Status
                    </span>
                    <Badge>{subscription.status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Billing Period
                    </span>
                    <span className="text-sm">
                      {subscription.billing_period || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Monthly Price
                    </span>
                    <span className="text-sm font-medium">
                      {formatCurrency(subscription.plan?.price_monthly || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Start Date
                    </span>
                    <span className="text-sm">
                      {formatDate(subscription.start_date || null)}
                    </span>
                  </div>
                  {subscription.trial_end_date && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Trial Ends
                      </span>
                      <span className="text-sm">
                        {formatDate(subscription.trial_end_date)}
                      </span>
                    </div>
                  )}
                  {subscription.cancelled_at && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Cancelled
                      </span>
                      <span className="text-sm text-red-600">
                        {formatDate(subscription.cancelled_at)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No active subscription
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    User is on free plan
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-4">
            {usage ? (
              <Card>
                <CardHeader>
                  <CardTitle>Usage Metrics</CardTitle>
                  <CardDescription>
                    Current usage against plan limits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(usage).map(([key, value]) => {
                    if (
                      typeof value === "object" &&
                      value !== null &&
                      "used" in value
                    ) {
                      const usageValue = value as {
                        used: number;
                        limit: number;
                        percentage?: number;
                      };
                      const percentage = usageValue.percentage || 0;
                      return (
                        <div key={key}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium capitalize">
                              {key.replace(/_/g, " ")}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {usageValue.used} /{" "}
                              {usageValue.limit === -1 ? "∞" : usageValue.limit}
                            </span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                percentage > 90
                                  ? "bg-red-600"
                                  : percentage > 75
                                    ? "bg-orange-500"
                                    : "bg-green-600"
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No usage data available
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Last Login
                  </span>
                  <span className="text-sm">
                    {formatDate(
                      (activitySummary?.last_login as
                        | string
                        | null
                        | undefined) || null,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Content Created
                  </span>
                  <span className="text-sm font-medium">
                    {(activitySummary?.total_content_created as number) || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Knowledge Items
                  </span>
                  <span className="text-sm font-medium">
                    {(activitySummary?.total_knowledge_items as number) || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Workspaces
                  </span>
                  <span className="text-sm font-medium">
                    {(activitySummary?.workspaces_count as number) || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <CustomerNotesTimeline
              customerId={customerId}
              notes={notes}
              onNoteAdded={refetch}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
