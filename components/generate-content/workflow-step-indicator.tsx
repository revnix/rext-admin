"use client";

import { Check } from "lucide-react";

import { useNow } from "@/hooks/use-now";
import type { RunStage } from "@/lib/generate-content/run-stages";
import { formatDuration } from "@/lib/generate-content/run-timings";
import type { GenerateStep } from "@/lib/generate-content/workflow-steps";
import { cn } from "@/lib/utils";

type StepState = "done" | "current" | "not-started";

/** What a screen reader hears after each step's name: the markers carry it by shape alone. */
const STATE_WORDS: Record<StepState, string> = {
  done: "done",
  current: "current step",
  "not-started": "not started",
};

export interface WorkflowStepIndicatorProps {
  steps: GenerateStep[];
  /** The current step's index: the steps before it are done. */
  current: number;
  /** What was chosen at each step, said under the done ones. */
  choices?: (string | null | undefined)[];
  /** The stage running for the current step, while the page waits on it: said in place of its hint. */
  running?: RunStage;
}

/** Done: a check on the inset surface. Current: its number on the accent, the stepper's one use of it.
 *  Not started: its number in a hollow dashed circle. Shape tells them apart as well as colour. */
function Marker({ state, number }: { state: StepState; number: number }) {
  return (
    <span
      aria-hidden
      className={cn(
        "num grid size-6 shrink-0 place-items-center rounded-full text-caption font-semibold",
        state === "done" &&
          "border border-border-strong bg-surface-inset text-foreground",
        state === "current" && "bg-primary text-primary-foreground",
        state === "not-started" &&
          "border border-dashed border-border-strong bg-surface-raised text-muted-foreground",
      )}
    >
      {state === "done" ? <Check className="size-4" /> : number}
    </span>
  );
}

/** "Writing five titles · 12 s": the stage running for the current step, its time moving each second. */
function RunningStage({ stage }: { stage: RunStage }) {
  const now = useNow(1000).getTime();
  return stage.startedAt
    ? `${stage.label} · ${formatDuration(now - stage.startedAt)}`
    : stage.label;
}

/**
 * The Generate flow's steps in one row across the top of the working area (rext-control #693,
 * FB2.12, option A): the steps done with a check and what was chosen, the current one with its hint or
 * the stage running for it ("Writing five titles · 12 s"), the rest hollow. It answers to its own
 * width: under 42 rem (a phone, the editor's column) it shows the markers alone, then the current step
 * and the next one in words. Going back to a done step needs the backend first, so none is a control
 * yet; the row leaves them the room.
 */
export function WorkflowStepIndicator({
  steps,
  current,
  choices = [],
  running,
}: WorkflowStepIndicatorProps) {
  const currentStep = steps[current];
  const nextStep = steps[current + 1];

  return (
    <nav
      aria-label="Article steps"
      className="@container border-b border-border pb-4"
    >
      <ol className="grid grid-cols-[repeat(5,minmax(0,1fr))_auto] @2xl:grid-cols-6">
        {steps.map((step, index) => {
          const state: StepState =
            index < current
              ? "done"
              : index === current
                ? "current"
                : "not-started";
          const line =
            state === "done"
              ? choices[index]
              : state === "current"
                ? step.hint
                : undefined;
          return (
            <li
              key={step.id}
              aria-current={state === "current" ? "step" : undefined}
              data-state={state}
              className="min-w-0"
            >
              <div className="flex items-center gap-2">
                <Marker state={state} number={index + 1} />
                {index < steps.length - 1 && (
                  // Solid from a done step, dashed on from the current one.
                  <span
                    aria-hidden
                    className={cn(
                      "mr-2 flex-1 border-t border-border-strong",
                      state !== "done" && "border-dashed",
                    )}
                  />
                )}
              </div>
              <div className="mt-2 flex min-w-0 flex-col gap-0.5 pr-4 @max-2xl:sr-only">
                <span
                  className={cn(
                    "truncate text-label",
                    state === "current" && "font-semibold",
                    state === "not-started" &&
                      "font-normal text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
                {state === "current" && running ? (
                  <span className="num truncate text-caption text-muted-foreground">
                    <RunningStage stage={running} />
                  </span>
                ) : line ? (
                  // Cut short in a narrow column; the whole of it on hover.
                  <span
                    className="truncate text-caption text-muted-foreground"
                    title={line}
                  >
                    {line}
                  </span>
                ) : null}
                <span className="sr-only">, {STATE_WORDS[state]}</span>
              </div>
            </li>
          );
        })}
      </ol>
      {currentStep && (
        // The narrow form's words; the list above already says them to a screen reader.
        <p
          aria-hidden
          className="mt-3 flex justify-between gap-3 text-label @2xl:hidden"
        >
          <span className="min-w-0 truncate">
            <span className="font-semibold">{currentStep.label}</span>{" "}
            <span className="num font-normal text-muted-foreground">
              · Step {current + 1} of {steps.length}
            </span>
          </span>
          {nextStep && (
            <span className="truncate font-normal text-muted-foreground">
              Next: {nextStep.label}
            </span>
          )}
        </p>
      )}
    </nav>
  );
}
