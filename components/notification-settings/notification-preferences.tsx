"use client";

import { type Control, Controller } from "react-hook-form";
import { FieldController } from "@/components/forms/field-controller";
import { FormSection, FormShell } from "@/components/forms/form-shell";
import { useSavedStatus } from "@/components/forms/use-saved-status";
import { useZodForm } from "@/components/forms/use-zod-form";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import {
  type NotificationPreferences,
  type NotificationPreferencesApiResponse,
  notificationPreferencesSchema,
  parseNotificationPreferencesApi,
} from "@/schemas/notification-schemas";

interface NotificationPreferencesFormProps {
  initialPreferences: NotificationPreferencesApiResponse;
}

/**
 * Maps notification preference API payloads into form default values.
 * Missing nested sections are defaulted to `false` or safe form defaults.
 */
export function transformApiToFormData(
  apiData: ReturnType<typeof parseNotificationPreferencesApi>,
): NotificationPreferences {
  return {
    ws_invite_received: apiData.workspace_notifications.invite_received,
    ws_invite_accepted: apiData.workspace_notifications.invite_accepted,
    ws_role_changed: apiData.workspace_notifications.role_changed,
    ws_member_removed: apiData.workspace_notifications.member_removed,
    gen_completed: apiData.content_generation.generation_completed,
    gen_started: apiData.content_generation.generation_started,
    gen_failed: apiData.content_generation.generation_failed,
    gen_published: apiData.content_generation.content_published,
    billing_payment_success: apiData.billing.payment_success,
    billing_payment_failed: apiData.billing.payment_failed,
    billing_subscription_cancelled: apiData.billing.subscription_cancelled,
    billing_subscription_expiring: apiData.billing.subscription_expiring,
    billing_trial_ending: apiData.billing.trial_ending,
    billing_usage_limit_warning: apiData.billing.usage_limit_warning,
    billing_usage_limit_exceeded: apiData.billing.usage_limit_exceeded,
    digest_enabled: apiData.email_digest.enabled,
    digest_frequency: apiData.email_digest.frequency,
    marketing_updates: apiData.marketing.marketing_updates,
  };
}

type Toggle = {
  [K in keyof NotificationPreferences]: NotificationPreferences[K] extends boolean
    ? K
    : never;
}[keyof NotificationPreferences];

/** The preferences by area, each one a sentence about when it arrives. */
const AREAS: {
  title: string;
  toggles: { name: Toggle; label: string; description: string }[];
}[] = [
  {
    title: "Workspaces",
    toggles: [
      {
        name: "ws_invite_received",
        label: "Invitations",
        description: "When you're invited to join a workspace.",
      },
      {
        name: "ws_invite_accepted",
        label: "Accepted invitations",
        description: "When someone accepts your invitation.",
      },
      {
        name: "ws_role_changed",
        label: "Role changes",
        description: "When your role in a workspace changes.",
      },
      {
        name: "ws_member_removed",
        label: "Removed members",
        description: "When a member is removed from your workspace.",
      },
    ],
  },
  {
    title: "Articles",
    toggles: [
      {
        name: "gen_started",
        label: "Generation started",
        description: "When an article starts generating.",
      },
      {
        name: "gen_completed",
        label: "Article ready",
        description: "When an article has finished generating.",
      },
      {
        name: "gen_failed",
        label: "Generation failed",
        description: "When an article couldn't be generated.",
      },
      {
        name: "gen_published",
        label: "Published",
        description: "When an article is published to your site.",
      },
    ],
  },
  {
    title: "Billing",
    toggles: [
      {
        name: "billing_payment_success",
        label: "Payments",
        description: "When a payment goes through.",
      },
      {
        name: "billing_payment_failed",
        label: "Failed payments",
        description: "When a payment doesn't go through.",
      },
      {
        name: "billing_subscription_cancelled",
        label: "Cancellation",
        description: "When your subscription is cancelled.",
      },
      {
        name: "billing_subscription_expiring",
        label: "Subscription ending",
        description: "When your subscription is about to end.",
      },
      {
        name: "billing_trial_ending",
        label: "Trial ending",
        description: "When your trial is about to end.",
      },
      {
        name: "billing_usage_limit_warning",
        label: "Near your limits",
        description: "When you're close to your plan's limits.",
      },
      {
        name: "billing_usage_limit_exceeded",
        label: "Limits reached",
        description: "When you've reached your plan's limits.",
      },
    ],
  },
];

/** One preference: its name and when it arrives, with the switch beside them. */
function ToggleField({
  control,
  name,
  label,
  description,
}: {
  control: Control<NotificationPreferences>;
  name: Toggle;
  label: string;
  description: string;
}) {
  const id = `notification-${name}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <FieldDescription id={`${id}-help`}>{description}</FieldDescription>
          </FieldContent>
          <Switch
            id={id}
            role="switch"
            checked={field.value}
            onCheckedChange={field.onChange}
            onBlur={field.onBlur}
            aria-describedby={`${id}-help`}
          />
        </Field>
      )}
    />
  );
}

/**
 * Account settings, Notifications (plans/app/D-pages.md §2.8): what you hear about, by area, on the
 * field set and FormShell (sections, Save with the inline "Saved", the leave guard).
 */
export function NotificationPreferencesForm({
  initialPreferences,
}: NotificationPreferencesFormProps) {
  const form = useZodForm(notificationPreferencesSchema, {
    defaultValues: transformApiToFormData(
      parseNotificationPreferencesApi(initialPreferences),
    ),
  });
  const { status, markSaved } = useSavedStatus(form.formState.isDirty);
  const digestEnabled = form.watch("digest_enabled");
  const serverError = form.formState.errors.root?.server?.message;

  const onSubmit = async (data: NotificationPreferences) => {
    try {
      await apiClient.notifications.updatePreferences(data);
      markSaved();
      form.reset(data);
    } catch (error) {
      log.error("[NotificationPreferences] Update failed:", error);
      form.setError("root.server", {
        message: "Your preferences couldn't be saved. Try again.",
      });
    }
  };

  return (
    <FormShell
      form={form}
      onSubmit={onSubmit}
      submitLabel="Save preferences"
      status={status}
    >
      {serverError && <Notice tone="danger">{serverError}</Notice>}
      {AREAS.map((area) => (
        <FormSection key={area.title} title={area.title}>
          {area.toggles.map((toggle) => (
            <ToggleField key={toggle.name} control={form.control} {...toggle} />
          ))}
        </FormSection>
      ))}
      <FormSection
        title="Email digest"
        description="A summary of your account's activity, by email."
      >
        <ToggleField
          control={form.control}
          name="digest_enabled"
          label="Send me a digest"
          description="As often as you choose below."
        />
        <FieldController
          control={form.control}
          name="digest_frequency"
          label="How often"
        >
          {({ value, onChange, onBlur, ref, id, ...aria }) => (
            <Select
              disabled={!digestEnabled}
              value={value}
              onValueChange={onChange}
            >
              <SelectTrigger
                ref={ref}
                id={id}
                onBlur={onBlur}
                className="sm:w-48"
                aria-invalid={aria["aria-invalid"]}
                aria-describedby={aria["aria-describedby"]}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem data-rec="show" value="daily">
                  Daily
                </SelectItem>
                <SelectItem data-rec="show" value="weekly">
                  Weekly
                </SelectItem>
                <SelectItem data-rec="show" value="monthly">
                  Monthly
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </FieldController>
      </FormSection>
      <FormSection title="Product news">
        <ToggleField
          control={form.control}
          name="marketing_updates"
          label="Updates and tips"
          description="New features, tips and offers from Rext."
        />
      </FormSection>
    </FormShell>
  );
}
