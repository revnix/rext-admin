"use client";

import type { FocusEvent, FormEvent } from "react";
import { useRef } from "react";
import {
  type AnalyticsEvent,
  analytics,
  type EventProperties,
} from "@/lib/analytics";

/**
 * How far a person gets in a form on a page that is never recorded (rext-control task 712): that
 * they began to fill it in, and which fields they left with something in them. Each is said
 * once per page. Never a value, nor its length: only whether a field holds anything.
 *
 * `fields` maps a field's name in the form to its name in the event, and is the whole list of
 * what is reported: a field that isn't on it says nothing. Spread the result on the `<form>`.
 */
export function useFormProgress({
  started,
  fieldFilled,
  fields,
  properties,
}: {
  started: AnalyticsEvent;
  fieldFilled: AnalyticsEvent;
  fields: Record<string, string>;
  /** Sent with `started`, as they are when the person begins. */
  properties?: EventProperties;
}) {
  const sent = useRef({ started: false, fields: new Set<string>() });
  const latest = useRef(properties);
  latest.current = properties;

  /** A field the person can type in and that is on the list: its name for an event, and whether it holds anything. */
  const reported = (
    target: EventTarget,
  ): { field: string; filled: boolean } | null => {
    if (
      !(target instanceof HTMLInputElement) &&
      !(target instanceof HTMLTextAreaElement)
    ) {
      return null;
    }
    // Filled in for the person (an invitation's email): not theirs to have filled.
    if (target.readOnly || target.disabled) return null;
    const field = fields[target.name];
    return field ? { field, filled: target.value !== "" } : null;
  };

  return {
    onInputCapture: (event: FormEvent<HTMLFormElement>) => {
      if (sent.current.started || reported(event.target) === null) return;
      sent.current.started = true;
      analytics.track(started, { ...latest.current });
    },
    onBlurCapture: (event: FocusEvent<HTMLFormElement>) => {
      const left = reported(event.target);
      if (left === null || !left.filled) return;
      if (sent.current.fields.has(left.field)) return;
      sent.current.fields.add(left.field);
      analytics.track(fieldFilled, { field: left.field });
    },
  };
}
