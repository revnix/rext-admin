"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SubscriptionPlanForm } from "@/components/admin/subscription-plans/subscription-plan-form";
import { DataTable } from "@/components/data-table";
import { PageLayout } from "@/components/page-layout";
import { CanAccess } from "@/components/permissions/can-access";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { SUBSCRIPTION_PERMISSIONS } from "@/lib/permissions";
import type { SubscriptionPlan } from "@/types/subscription";

interface PlansResponse {
  plans: SubscriptionPlan[];
  count: number;
}

export default function SubscriptionPlansPage() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const breadcrumbs = [
    { label: "Admin", href: "/admin" },
    { label: "Subscription Analytics", href: "/admin/subscriptions" },
    { label: "Plans" },
  ];

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

  const columns = [
    {
      key: "display_name",
      header: "Name",
      cell: (_value: unknown, row: SubscriptionPlan) => (
        <div>
          <div className="font-medium">{row.display_name}</div>
          <div className="text-xs text-muted-foreground">{row.name}</div>
        </div>
      ),
    },
    {
      key: "price_monthly",
      header: "Monthly Price",
      cell: (_value: unknown, row: SubscriptionPlan) => (
        <span className="font-mono">
          ${Number(row.price_monthly).toFixed(2)}
        </span>
      ),
    },
    {
      key: "price_yearly",
      header: "Yearly Price",
      cell: (_value: unknown, row: SubscriptionPlan) => (
        <div>
          <span className="font-mono">
            ${Number(row.price_yearly).toFixed(2)}
          </span>
          {row.price_monthly > 0 && (
            <div className="text-xs text-green-600">
              Save{" "}
              {Math.round(
                ((row.price_monthly * 12 - row.price_yearly) /
                  (row.price_monthly * 12)) *
                  100,
              )}
              %
            </div>
          )}
        </div>
      ),
    },
    {
      key: "max_workspaces",
      header: "Limits",
      cell: (_value: unknown, row: SubscriptionPlan) => (
        <div className="text-xs space-y-0.5">
          <div>
            Workspaces: {row.max_workspaces === -1 ? "∞" : row.max_workspaces}
          </div>
          <div>
            Members:{" "}
            {row.max_members_per_workspace === -1
              ? "∞"
              : row.max_members_per_workspace}
          </div>
          <div>Topics: {row.max_topics === -1 ? "∞" : row.max_topics}</div>
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      cell: (_value: unknown, row: SubscriptionPlan) => (
        <div className="flex flex-col gap-1">
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              row.is_active
                ? "bg-green-50 text-green-700"
                : "bg-gray-50 text-gray-600"
            }`}
          >
            {row.is_active ? "Active" : "Inactive"}
          </span>
          {!row.is_public && (
            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
              Private
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageLayout
      title="Subscription Plans"
      description="Manage subscription plans and pricing"
      breadcrumbs={breadcrumbs}
      actions={
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      }
    >
      <CanAccess
        permission={SUBSCRIPTION_PERMISSIONS.MANAGE}
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
                <code className="text-xs bg-muted px-1 rounded">
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
              data={plans}
              columns={columns}
              searchFields={["display_name", "name", "description"]}
              searchPlaceholder="Search plans..."
              isLoading={isLoading}
              emptyTitle="No plans found"
              emptyDescription="Get started by creating your first subscription plan."
              emptyActions={[
                {
                  label: "Create Plan",
                  onClick: () => setCreateDialogOpen(true),
                },
              ]}
              rowActions={[
                {
                  label: "Edit",
                  icon: <Pencil className="h-4 w-4" />,
                  onClick: (plan) => {
                    setEditingPlan(plan);
                    setEditDialogOpen(true);
                  },
                },
                {
                  label: "Delete",
                  icon: <Trash2 className="h-4 w-4" />,
                  onClick: (plan) => {
                    if (
                      confirm(
                        `Are you sure you want to delete "${plan.display_name}"? This action cannot be undone.`,
                      )
                    ) {
                      deleteMutation.mutate(plan.id);
                    }
                  },
                  variant: "destructive",
                },
              ]}
            />
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
      </CanAccess>
    </PageLayout>
  );
}
