"use client";

import { useEffect, useRef } from "react";
import {
  CHECKLIST_STEP_COUNT,
  type ChecklistStep,
} from "@/components/home/home-data";
import { analytics } from "@/lib/analytics";
import { local } from "@/lib/storage";
import { ONBOARDING_STORAGE_KEYS } from "@/lib/storage-keys";

/** The tracked-milestones entry that records the completion event was sent. */
const COMPLETION_ID = "onboarding-completed";
/** The required milestones of the first checklist (workspace, topic, content): completion was sent with them. */
const LEGACY_REQUIRED = ["workspace", "topic", "content"];

/**
 * Reports each checklist step the first time it's seen done, and the whole list once, per workspace.
 * The ids already reported are kept in the browser under the key the earlier checklist used, so a
 * step or a completion reported before isn't counted twice.
 */
export function useChecklistAnalytics(
  workspaceId: string | undefined,
  userId: string | undefined,
  steps: ChecklistStep[],
  ready: boolean,
) {
  // The steps are rebuilt on every render of the page; what they say is this signature.
  const signature = steps.map((step) => `${step.id}:${step.done}`).join(",");
  const latest = useRef(steps);
  latest.current = steps;

  useEffect(() => {
    const steps = latest.current;
    if (!ready || !workspaceId || !signature) return;
    const key = ONBOARDING_STORAGE_KEYS.trackedMilestones(workspaceId);
    const tracked = new Set(local.getJSON<string[]>(key, []));
    const doneCount = steps.filter((step) => step.done).length;
    let changed = false;

    for (const step of steps) {
      if (!step.done || tracked.has(step.id)) continue;
      tracked.add(step.id);
      changed = true;
      analytics.track("onboarding_milestone_completed", {
        milestone_id: step.id,
        milestone_label: step.label,
        workspace_id: workspaceId,
        user_id: userId,
        progress_percentage: Math.round(
          (doneCount / CHECKLIST_STEP_COUNT) * 100,
        ),
      });
    }

    const reported =
      tracked.has(COMPLETION_ID) ||
      LEGACY_REQUIRED.every((id) => tracked.has(id));
    // Completion needs every step known and done: a step hidden by a failed request or the role
    // isn't a done one.
    if (doneCount === CHECKLIST_STEP_COUNT && !reported) {
      tracked.add(COMPLETION_ID);
      changed = true;
      analytics.track("onboarding_completed", {
        workspace_id: workspaceId,
        user_id: userId,
      });
    }

    if (changed) local.setJSON(key, Array.from(tracked));
  }, [ready, workspaceId, userId, signature]);
}
