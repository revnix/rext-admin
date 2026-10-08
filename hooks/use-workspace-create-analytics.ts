"use client";

import { useCallback, useEffect, useRef } from "react";

import { analytics } from "@/lib/analytics";

/** A field of the create form, by its name in analytics: never what was typed in it. */
export type CreateField = "name" | "website" | "description";
/**
 * Why a create was refused: the form's own check, the website not answering, the plan, a session
 * the API doesn't accept (told apart from the rest: no retyping fixes it), or the API otherwise.
 */
export type CreateRefusal =
  | "form"
  | "unreachable"
  | "limit"
  | "session"
  | "backend";
/** The stage a wait is in, in analytics' words. */
export type WaitStage = "reading" | "voice" | "competitors";

/** Whole seconds since a moment, or nothing when the moment never came. */
const seconds = (since: number | null) =>
  since === null
    ? undefined
    : Math.max(0, Math.round((Date.now() - since) / 1000));

/**
 * Creating a workspace, moment by moment, for analytics (rext-control task 854): the form seen, the
 * way in chosen, a field left with something in it, Create pressed, a refusal and its kind, the
 * wait started, left before it ended, the review reached, finished. So the funnel says where a
 * newcomer stops. Nothing a person typed is ever a property: a field is named, never quoted, and a
 * refusal is a kind and a status, never its words.
 *
 * `step` is the wizard's: 0 the form, 1 the wait, 2 the review.
 */
export function useWorkspaceCreateAnalytics({
  step,
  firstWorkspace,
  withWebsite,
  stage,
}: {
  step: 0 | 1 | 2;
  /** The person has no workspace yet: the newcomer the question is about. */
  firstWorkspace: boolean;
  withWebsite: boolean;
  /** Where the wait is, for the event sent when it is left. */
  stage: WaitStage;
}) {
  // What an event says is read when it is sent, not when a handler was made.
  const now = useRef({ firstWorkspace, withWebsite, stage, step });
  now.current = { firstWorkspace, withWebsite, stage, step };
  const typed = useRef(new Set<CreateField>());
  const filled = useRef(new Set<CreateField>());
  const waitStarted = useRef<number | null>(null);
  const reviewStarted = useRef<number | null>(null);
  const leftSent = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the form is seen once, when the page opens
  useEffect(() => {
    analytics.track("workspace_create_viewed", {
      first_workspace: firstWorkspace,
    });
  }, []);

  // The wait and the review, as the wizard reaches them.
  useEffect(() => {
    if (step === 1 && waitStarted.current === null) {
      waitStarted.current = Date.now();
      leftSent.current = false;
      analytics.track("workspace_wait_started", {
        with_website: now.current.withWebsite,
      });
    } else if (step === 2 && reviewStarted.current === null) {
      reviewStarted.current = Date.now();
      analytics.track("workspace_review_reached", {
        seconds: seconds(waitStarted.current),
        with_website: now.current.withWebsite,
      });
    } else if (step === 0) {
      // Back at the form (the workspace wasn't saved): the next wait is a new one.
      waitStarted.current = null;
      reviewStarted.current = null;
    }
  }, [step]);

  // Leaving during the wait: the page hidden or closed, or another page opened. Once per wait,
  // by beacon, and never once the review was reached.
  useEffect(() => {
    const left = () => {
      if (now.current.step !== 1 || leftSent.current) return;
      leftSent.current = true;
      analytics.track(
        "workspace_wait_left",
        {
          seconds: seconds(waitStarted.current),
          stage: now.current.stage,
          with_website: now.current.withWebsite,
        },
        { leaving: true },
      );
    };
    const hidden = () => {
      if (document.visibilityState === "hidden") left();
    };
    window.addEventListener("pagehide", left);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("pagehide", left);
      document.removeEventListener("visibilitychange", hidden);
      left();
    };
  }, []);

  /** "I don't have a website yet", or back. */
  const wayChosen = useCallback((way: "website" | "description") => {
    analytics.track("workspace_create_way_chosen", { way });
  }, []);

  /** A key was pressed in a field, or something pasted into it: a person, not the browser. */
  const fieldTyped = useCallback((field: CreateField) => {
    typed.current.add(field);
  }, []);

  /**
   * A field was left: counted once, when something is in it that a person put there. A form can
   * arrive with values (the browser fills it), so a value alone is no sign of a person.
   */
  const fieldLeft = useCallback((field: CreateField, value: unknown) => {
    if (filled.current.has(field) || !typed.current.has(field)) return;
    if (typeof value !== "string" || !value.trim()) return;
    filled.current.add(field);
    analytics.track("workspace_create_field_filled", { field });
  }, []);

  /** Create was pressed with a form that passed its own check. */
  const submitted = useCallback(() => {
    analytics.track("workspace_create_submitted", {
      with_website: now.current.withWebsite,
      first_workspace: now.current.firstWorkspace,
    });
  }, []);

  /** A create that didn't happen, by its kind; the API's status as a number, never its words. */
  const refused = useCallback(
    (
      kind: CreateRefusal,
      where: { field?: CreateField; status?: number } = {},
    ) => {
      analytics.track("workspace_create_refused", {
        kind,
        field: where.field,
        status: where.status,
        with_website: now.current.withWebsite,
        first_workspace: now.current.firstWorkspace,
      });
    },
    [],
  );

  /** Finish was pressed on the review. */
  const reviewFinished = useCallback((changed: boolean) => {
    analytics.track("workspace_review_finished", {
      seconds_on_review: seconds(reviewStarted.current),
      changed,
    });
  }, []);

  return {
    wayChosen,
    fieldTyped,
    fieldLeft,
    submitted,
    refused,
    reviewFinished,
  };
}
