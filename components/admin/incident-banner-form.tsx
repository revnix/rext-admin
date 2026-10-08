"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { FieldController } from "@/components/forms/field-controller";
import { FormSection, FormShell } from "@/components/forms/form-shell";
import { useZodForm } from "@/components/forms/use-zod-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Notice } from "@/components/ui/notice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import {
  BANNER_AREAS,
  BANNER_MESSAGE_MAX,
  type IncidentBanner,
} from "@/lib/api-client/incident-banner";
import {
  BANNER_AREA_LABELS,
  incidentBannerQueryOptions,
  shownBanner,
} from "@/lib/incident-banner";
import { incidentBannerQueries } from "@/lib/query-keys";
import {
  type IncidentBannerValues,
  incidentBannerSchema,
} from "@/schemas/admin-schemas";

/** How long a banner may show: short by default, a day at most (the backend's limit). */
const DURATIONS = [
  { minutes: 30, label: "30 minutes" },
  { minutes: 60, label: "1 hour" },
  { minutes: 120, label: "2 hours" },
  { minutes: 240, label: "4 hours" },
  { minutes: 720, label: "12 hours" },
  { minutes: 1440, label: "24 hours" },
];

const NO_BANNER: IncidentBanner = {
  active: false,
  message: null,
  areas: [],
  started_at: null,
  expires_at: null,
};

const noop = () => {};

const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const clock = (time: number) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(time);

/**
 * The super admin's switch for the incident banner (rext-control#728): what is showing now, with
 * "Switch it off", and the form that shows a new one or replaces it. The banner is the shell's own
 * read, so what this form changes is on this page's banner at once, and on everyone's within a
 * minute.
 */
export function IncidentBannerForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const current = useQuery(incidentBannerQueryOptions());
  const showing = shownBanner(current.data);

  const form = useZodForm(incidentBannerSchema, {
    defaultValues: { message: "", areas: [], duration_minutes: 60 },
  });

  // A read already on its way (the first one, or the minute's) may hold the state from before the
  // switch: it is dropped first, so it can't land after the switch's answer and undo it on screen.
  const dropReads = () =>
    queryClient.cancelQueries({ queryKey: incidentBannerQueries.all() });
  const readAgain = () =>
    queryClient.invalidateQueries({ queryKey: incidentBannerQueries.all() });

  const show = useMutation({
    mutationFn: (values: IncidentBannerValues) =>
      apiClient.incidentBanner.set(values),
    onMutate: dropReads,
    onSuccess: (banner, values) => {
      queryClient.setQueryData(incidentBannerQueries.all(), banner);
      void readAgain();
      form.reset(values);
      toast.success(
        "The banner is showing. Everyone signed in sees it within a minute.",
      );
    },
    onError: (error: Error) =>
      toast.error(`The banner wasn't switched on: ${error.message}`),
  });

  const switchOff = useMutation({
    mutationFn: () => apiClient.incidentBanner.clear(),
    onMutate: dropReads,
    onSuccess: () => {
      queryClient.setQueryData(incidentBannerQueries.all(), NO_BANNER);
      void readAgain();
      toast.success("The banner is off.");
    },
    onError: (error: Error) =>
      toast.error(`The banner wasn't switched off: ${error.message}`),
  });

  // The two switches go to the backend one after the other, in the order they were asked for: a
  // replacement sent while a switch-off is still on its way waits for it, so the last thing asked
  // for is what stays. The form's button is busy meanwhile.
  const switchingOff = useRef<Promise<void> | null>(null);
  const switchItOff = () => {
    const sent = switchOff.mutateAsync().then(noop, noop);
    switchingOff.current = sent;
    void sent.finally(() => {
      if (switchingOff.current === sent) switchingOff.current = null;
    });
  };
  const showIt = async (values: IncidentBannerValues) => {
    await switchingOff.current;
    // A failure is said by the mutation's own toast.
    await show.mutateAsync(values).then(noop, noop);
  };

  return (
    <div className="flex flex-col gap-8">
      <section aria-label="Showing now">
        {showing ? (
          <Notice
            tone="info"
            title="A banner is showing"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={switchItOff}
                disabled={switchOff.isPending || show.isPending}
              >
                Switch it off
              </Button>
            }
          >
            <span className="break-words">“{showing.message}”</span>
            <span className="mt-1 block text-muted-foreground">
              {showing.affected && `Affected: ${showing.affected}. `}
              {showing.until !== null &&
                `It ends by itself at ${clock(showing.until)}.`}
            </span>
          </Notice>
        ) : current.isError ? (
          <Notice tone="warning" title="The banner's state couldn't be read">
            You can still show a banner below; whether one is showing now isn't
            known.
          </Notice>
        ) : (
          <p className="text-body text-muted-foreground">
            {current.isPending
              ? "Reading what is showing…"
              : "No banner is showing."}
          </p>
        )}
      </section>

      <FormShell
        form={form}
        // Held until the request settles: the button stays busy, so a second click or an edit
        // can't send a competing banner.
        onSubmit={showIt}
        submitLabel={showing ? "Replace the banner" : "Show the banner"}
      >
        <FormSection
          title={showing ? "Replace it" : "Show a banner"}
          description="Say what isn't working and that you're on it. Plain text only: links and formatting show as typed."
        >
          <FieldController
            control={form.control}
            name="message"
            label="Message"
            required
            maxLength={BANNER_MESSAGE_MAX}
            description="A sentence or two. For example: Article writing is slower than usual. We're working on it."
          >
            {(field) => (
              <Textarea {...field} rows={3} maxLength={BANNER_MESSAGE_MAX} />
            )}
          </FieldController>

          <FieldController
            control={form.control}
            name="areas"
            label="What is affected"
            description="Optional. The banner lists these after the message."
          >
            {(field) => (
              <fieldset
                id={field.id}
                aria-label="What is affected"
                aria-describedby={field["aria-describedby"]}
                className="grid gap-2 sm:grid-cols-2"
              >
                {BANNER_AREAS.map((area) => {
                  const id = `${field.id}-${area}`;
                  return (
                    <div key={area} className="flex items-center gap-2">
                      <Checkbox
                        id={id}
                        checked={field.value.includes(area)}
                        onCheckedChange={(checked) =>
                          field.onChange(
                            checked === true
                              ? [...field.value, area]
                              : field.value.filter((kept) => kept !== area),
                          )
                        }
                      />
                      <label htmlFor={id} className="text-body">
                        {sentence(BANNER_AREA_LABELS[area])}
                      </label>
                    </div>
                  );
                })}
              </fieldset>
            )}
          </FieldController>

          <FieldController
            control={form.control}
            name="duration_minutes"
            label="Show it for"
            required
            description="It ends by itself then, unless you switch it off first."
          >
            {(field) => (
              <Select
                value={String(field.value)}
                onValueChange={(minutes) => field.onChange(Number(minutes))}
              >
                <SelectTrigger
                  id={field.id}
                  aria-invalid={field["aria-invalid"]}
                  aria-describedby={field["aria-describedby"]}
                  onBlur={field.onBlur}
                  ref={field.ref}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map(({ minutes, label }) => (
                    <SelectItem key={minutes} value={String(minutes)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FieldController>
        </FormSection>
      </FormShell>
    </div>
  );
}
