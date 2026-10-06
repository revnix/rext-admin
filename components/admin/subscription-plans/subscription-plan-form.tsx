"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import type { SubscriptionPlan } from "@/types/subscription";

const planFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Name must be lowercase letters, numbers, and underscores only",
    ),
  display_name: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(150, "Display name must be less than 150 characters"),
  description: z.string().optional(),
  price_monthly: z
    .number()
    .min(0, "Price must be positive")
    .max(999999, "Price too large"),
  price_yearly: z
    .number()
    .min(0, "Price must be positive")
    .max(999999, "Price too large"),
  max_workspaces: z.number().int(),
  max_members_per_workspace: z.number().int(),
  is_active: z.boolean(),
  is_public: z.boolean(),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

interface SubscriptionPlanFormProps {
  plan?: SubscriptionPlan;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SubscriptionPlanForm({
  plan,
  onSuccess,
  onCancel,
}: SubscriptionPlanFormProps) {
  const isEditing = !!plan;

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: isEditing
      ? {
          name: plan.name,
          display_name: plan.display_name,
          description: plan.description || "",
          price_monthly: Number(plan.price_monthly),
          price_yearly: Number(plan.price_yearly),
          max_workspaces: plan.max_workspaces,
          max_members_per_workspace: plan.max_members_per_workspace,
          is_active: plan.is_active,
          is_public: plan.is_public,
        }
      : {
          name: "",
          display_name: "",
          description: "",
          price_monthly: 0,
          price_yearly: 0,
          max_workspaces: 1,
          max_members_per_workspace: 5,
          is_active: true,
          is_public: true,
        },
  });

  const mutation = useMutation({
    mutationFn: async (values: PlanFormValues) => {
      if (isEditing) {
        // Exclude name field for updates (can't change after creation)
        const { name: _name, ...updateData } = values;
        return apiClient.request(`/api/v1/subscriptions/plans/${plan.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });
      }
      return apiClient.request("/api/v1/subscriptions/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => {
      toast.success(
        isEditing ? "Plan updated successfully" : "Plan created successfully",
      );
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save plan");
    },
  });

  const onSubmit = (values: PlanFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Internal Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="pro"
                    {...field}
                    disabled={isEditing} // Can't change name after creation
                  />
                </FormControl>
                <FormDescription>
                  Unique identifier (lowercase, no spaces). Cannot be changed
                  after creation.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Pro Plan" {...field} />
                </FormControl>
                <FormDescription>
                  Name shown to users in the pricing page.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Perfect for growing teams..."
                    {...field}
                    rows={3}
                  />
                </FormControl>
                <FormDescription>
                  Brief description of the plan benefits.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Pricing</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price_monthly"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Price ($) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="29.99"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price_yearly"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yearly Price ($) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="299.99"
                      className="mt-1"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {form.watch("price_monthly") > 0 &&
                      form.watch("price_yearly") > 0 &&
                      `Save ${Math.round(((form.watch("price_monthly") * 12 - form.watch("price_yearly")) / (form.watch("price_monthly") * 12)) * 100)}%`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Limits */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Limits</h3>
          <p className="text-sm text-muted-foreground">
            Use -1 for unlimited. Use 0 to disable the feature.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="max_workspaces"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Workspaces *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="5"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_members_per_workspace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Members per Workspace *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="10"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Settings</h3>

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active</FormLabel>
                  <FormDescription>
                    Inactive plans cannot be selected by users.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_public"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Public</FormLabel>
                  <FormDescription>
                    Private plans are hidden from the pricing page (admin-only).
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? "Update Plan" : "Create Plan"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
