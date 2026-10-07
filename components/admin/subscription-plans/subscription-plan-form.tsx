"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { FieldController } from "@/components/forms/field-controller";
import { FormSection, FormShell } from "@/components/forms/form-shell";
import { ToggleController } from "@/components/forms/toggle-controller";
import { useZodForm } from "@/components/forms/use-zod-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import {
  type SubscriptionPlanFormValues,
  subscriptionPlanFormSchema,
} from "@/schemas/subscription-schemas";
import type { SubscriptionPlan } from "@/types/subscription";

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

  const form = useZodForm(subscriptionPlanFormSchema, {
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
    mutationFn: async (values: SubscriptionPlanFormValues) => {
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

  const onSubmit = async (values: SubscriptionPlanFormValues) => {
    await mutation.mutateAsync(values).catch(() => undefined);
  };

  const monthly = form.watch("price_monthly");
  const yearly = form.watch("price_yearly");
  const yearlySaving =
    monthly > 0 && yearly > 0
      ? Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100)
      : null;

  return (
    <FormShell
      form={form}
      onSubmit={onSubmit}
      submitLabel={isEditing ? "Update plan" : "Create plan"}
      cancel={{ onCancel }}
    >
      <FormSection title="Basic information">
        <FieldController
          control={form.control}
          name="name"
          label="Internal name"
          required
          description="A unique id: lowercase letters, numbers and underscores. It can't change after creation."
        >
          {(field) => (
            <Input
              {...field}
              placeholder="pro"
              disabled={isEditing} // Can't change name after creation
            />
          )}
        </FieldController>
        <FieldController
          control={form.control}
          name="display_name"
          label="Display name"
          required
          description="The name customers see on the pricing page."
        >
          {(field) => <Input {...field} placeholder="Pro Plan" />}
        </FieldController>
        <FieldController
          control={form.control}
          name="description"
          label="Description"
          description="What the plan gives, in a sentence or two."
        >
          {(field) => (
            <Textarea
              {...field}
              value={field.value ?? ""}
              rows={3}
              placeholder="Perfect for growing teams..."
            />
          )}
        </FieldController>
      </FormSection>

      <FormSection title="Pricing">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldController
            control={form.control}
            name="price_monthly"
            label="Monthly price ($)"
            required
          >
            {(field) => (
              <Input
                {...field}
                type="number"
                step="0.01"
                placeholder="29.99"
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          </FieldController>
          <FieldController
            control={form.control}
            name="price_yearly"
            label="Yearly price ($)"
            required
            description={
              yearlySaving !== null ? `Save ${yearlySaving}%` : undefined
            }
          >
            {(field) => (
              <Input
                {...field}
                type="number"
                step="0.01"
                placeholder="299.99"
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          </FieldController>
        </div>
      </FormSection>

      <FormSection
        title="Limits"
        description="Use -1 for unlimited. Use 0 to turn the feature off."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldController
            control={form.control}
            name="max_workspaces"
            label="Max workspaces"
            required
          >
            {(field) => (
              <Input
                {...field}
                type="number"
                placeholder="5"
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          </FieldController>
          <FieldController
            control={form.control}
            name="max_members_per_workspace"
            label="Max members per workspace"
            required
          >
            {(field) => (
              <Input
                {...field}
                type="number"
                placeholder="10"
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          </FieldController>
        </div>
      </FormSection>

      <FormSection title="Settings">
        <ToggleController
          control={form.control}
          name="is_active"
          kind="switch"
          label="Active"
          description="Customers can't choose an inactive plan."
        />
        <ToggleController
          control={form.control}
          name="is_public"
          kind="switch"
          label="Public"
          description="A private plan is hidden from the pricing page (admin-only)."
        />
      </FormSection>
    </FormShell>
  );
}
