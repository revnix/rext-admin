"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SubscriptionPlanForm } from "@/components/admin/subscription-plans/subscription-plan-form";
import { ListPage } from "@/components/layouts";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableRowAction,
  UNKNOWN,
} from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { apiClient } from "@/lib/api-client";
import { BILLING_PERMISSIONS } from "@/lib/permissions";
import type { SubscriptionPlan } from "@/types/subscription";

interface PlansResponse {
  plans: SubscriptionPlan[];
  count: number;
}

const money = (amount: number) => `$${Number(amount).toFixed(2)}`;
const limit = (value: number | null | undefined) =>
  value === -1 ? "∞" : (value ?? UNKNOWN);

function PlanName({ plan }: { plan: SubscriptionPlan }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-foreground">
        {plan.display_name}
      </p>
      <p className="truncate text-muted-foreground">{plan.name}</p>
    </div>
  );
}

function PlanStatus({ plan }: { plan: SubscriptionPlan }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      <Badge variant={plan.is_active ? "success" : "neutral"}>
        {plan.is_active ? "Active" : "Inactive"}
      </Badge>
      {!plan.is_public && <Badge variant="neutral">Private</Badge>}
    </span>
  );
}

const column = createDataTableColumnHelper<SubscriptionPlan>();

const columns = column.columns([
  column.accessor((plan) => `${plan.display_name} ${plan.name}`, {
    id: "name",
    header: "Name",
    cell: ({ row }) => <PlanName plan={row.original} />,
  }),
  column.accessor((plan) => plan.description ?? "", {
    id: "description",
    header: "Description",
  }),
  column.accessor("price_monthly", {
    header: "Monthly price",
    meta: { align: "end", numeric: true },
    cell: ({ getValue }) => money(getValue()),
    enableGlobalFilter: false,
  }),
  column.accessor("price_yearly", {
    header: "Yearly price",
    meta: { align: "end", numeric: true },
    cell: ({ row }) => {
      const plan = row.original;
      const yearOfMonths = plan.price_monthly * 12;
      return (
        <div>
          <p>{money(plan.price_yearly)}</p>
          {plan.price_monthly > 0 && (
            <p className="text-muted-foreground">
              saves{" "}
              {Math.round(
                ((yearOfMonths - plan.price_yearly) / yearOfMonths) * 100,
              )}
              %
            </p>
          )}
        </div>
      );
    },
    enableGlobalFilter: false,
  }),
  column.display({
    id: "limits",
    header: "Limits",
    cell: ({ row }) => {
      const plan = row.original;
      return (
        <div className="num space-y-0.5 text-muted-foreground">
          <p>Workspaces: {limit(plan.max_workspaces)}</p>
          <p>Members: {limit(plan.max_members_per_workspace)}</p>
          <p>Credits: {plan.credits_per_month ?? UNKNOWN} a month</p>
        </div>
      );
    },
  }),
  column.accessor((plan) => (plan.is_active ? "active" : "inactive"), {
    id: "status",
    header: "Status",
    cell: ({ row }) => <PlanStatus plan={row.original} />,
    enableGlobalFilter: false,
  }),
]);

// The description is searched but not shown: the name says enough in a row.
const HIDDEN_COLUMNS = ["description"];

export default function SubscriptionPlansPage() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch plans
  const { data: plansResponse, isLoading } = useQuery({
    queryKey: ["admin", "subscription-plans"],
    queryFn: async () => {
      return apiClient.request<PlansResponse>(
        "/api/v1/subscriptions/plans?include_inactive=true&include_private=true",
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (planId: string) => {
      return apiClient.request(`/api/v1/subscriptions/plans/${planId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "subscription-plans"],
      });
      toast.success("Plan deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete plan");
    },
  });

  const plans = plansResponse?.plans || [];

  const { confirm, ConfirmationComponent } = useConfirmation();
  const deletePlan = async (plan: SubscriptionPlan) => {
    const confirmed = await confirm({
      title: "Delete this plan?",
      description: `"${plan.display_name}" is deleted. This can't be undone.`,
      confirmText: "Delete plan",
      variant: "destructive",
    });
    if (confirmed) deleteMutation.mutate(plan.id);
  };

  const rowActions = (plan: SubscriptionPlan): DataTableRowAction[] => [
    {
      label: "Edit",
      icon: Edit,
      onSelect: () => {
        setEditingPlan(plan);
        setEditDialogOpen(true);
      },
    },
    {
      label: "Delete",
      icon: Trash2,
      destructive: true,
      onSelect: () => void deletePlan(plan),
    },
  ];

  return (
    <ListPage
      title="Subscription Plans"
      description="Manage subscription plans and pricing"
      actions={
        <Button
          className="w-full sm:w-auto hidden"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      }
    >
      <PermissionGuard
        permission={BILLING_PERMISSIONS.MANAGE}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to manage subscription plans.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permission:{" "}
                <code className="text-xs bg-muted px-1 rounded-md">
                  subscription.manage
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>All Plans</CardTitle>
            <CardDescription>
              {plans.length} subscription plan{plans.length !== 1 ? "s" : ""}{" "}
              total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              caption="Subscription plans"
              columns={columns}
              data={plans}
              getRowId={(plan) => plan.id}
              getRowLabel={(plan) => plan.display_name}
              isLoading={isLoading}
              surface="plain"
              search={{ placeholder: "Search plans" }}
              hiddenColumns={HIDDEN_COLUMNS}
              rowActions={rowActions}
              emptyState={
                <EmptyState
                  title="No plans yet"
                  description="Create the first subscription plan."
                  action={{
                    label: "Create plan",
                    onClick: () => setCreateDialogOpen(true),
                  }}
                />
              }
              renderCard={(plan, { actions }) => (
                <div className="flex items-start gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <PlanName plan={plan} />
                    <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                      <PlanStatus plan={plan} />
                      <span className="num">
                        {money(plan.price_monthly)} a month
                      </span>
                    </div>
                  </div>
                  {actions}
                </div>
              )}
            />
            {ConfirmationComponent}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Subscription Plan</DialogTitle>
              <DialogDescription>
                Define a new subscription plan with pricing and limits.
              </DialogDescription>
            </DialogHeader>
            <SubscriptionPlanForm
              onSuccess={() => {
                setCreateDialogOpen(false);
                queryClient.invalidateQueries({
                  queryKey: ["admin", "subscription-plans"],
                });
              }}
              onCancel={() => setCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Subscription Plan</DialogTitle>
              <DialogDescription>
                Update plan pricing and limits. Changes will affect new
                subscriptions only.
              </DialogDescription>
            </DialogHeader>
            {editingPlan && (
              <SubscriptionPlanForm
                plan={editingPlan}
                onSuccess={() => {
                  setEditDialogOpen(false);
                  setEditingPlan(null);
                  queryClient.invalidateQueries({
                    queryKey: ["admin", "subscription-plans"],
                  });
                }}
                onCancel={() => {
                  setEditDialogOpen(false);
                  setEditingPlan(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </PermissionGuard>
    </ListPage>
  );
}
