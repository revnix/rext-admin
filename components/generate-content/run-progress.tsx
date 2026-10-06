"use client";

import { Check, Circle, Loader2, Minus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Notice } from "@/components/ui/notice";
import type {
  RunStage,
  RunStageState,
} from "@/lib/generate-content/run-stages";
import {
  expectedStageMs,
  formatDuration,
} from "@/lib/generate-content/run-timings";
import { cn } from "@/lib/utils";

/** Past this share of its usual time, an active stage says it is still working. */
const SLOW_FACTOR = 1.5;

/** The current time, ticking each second while `running`. */
function useNow(running: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [running]);
  return now;
}

function StageIcon({ state }: { state: RunStageState }) {
  switch (state) {
    case "complete":
      return <Check className="size-4 text-foreground" aria-hidden />;
    case "active":
      return (
        <Loader2
          className="size-4 animate-spin text-primary motion-reduce:animate-none"
          aria-hidden
        />
      );
    case "failed":
      return <X className="size-4 text-danger-600" aria-hidden />;
    case "skipped":
      return <Minus className="size-4 text-muted-foreground" aria-hidden />;
    default:
      return <Circle className="size-4 text-muted-foreground" aria-hidden />;
  }
}

const STATE_WORDS: Record<RunStageState, string> = {
  pending: "waiting",
  active: "running",
  complete: "done",
  failed: "failed",
  skipped: "skipped",
};

/** What the stage's time column says. */
function stageTime(stage: RunStage, now: number, expected?: number): string {
  if (stage.state === "failed") return "Failed";
  if (stage.state === "skipped") return "Skipped";
  if (stage.state === "pending") {
    return expected ? `about ${formatDuration(expected)}` : "";
  }
  // A stage seen only from outside (the dock) may have no times: say nothing rather than "0 s".
  if (!stage.startedAt) return "";
  const end = stage.state === "complete" ? (stage.endedAt ?? now) : now;
  return formatDuration(end - stage.startedAt);
}

export interface RunProgressProps {
  stages: RunStage[];
  /** "expanded": a row per stage. "compact": the active stage and its time on one line over a thin bar,
   *  for the dock's row, which shows the job's state icon itself. */
  variant?: "expanded" | "compact";
  /** The run hit LangGraph's time limit: said plainly, in place of the "still working" line. */
  timedOut?: boolean;
  /** Offered beside "still working" once a stage runs past 1.5 times its usual time. */
  onCancel?: () => void;
  className?: string;
}

/**
 * A run as named stages (design/app-language.md §8): each one waiting, running, done, failed or
 * skipped, with its time; the running one against its usual time, and "still working" with Cancel
 * once it takes 1.5 times that. A live region announces each stage as it starts.
 */
export function RunProgress({
  stages,
  variant = "expanded",
  timedOut = false,
  onCancel,
  className,
}: RunProgressProps) {
  const active = stages.find((stage) => stage.state === "active");
  const now = useNow(Boolean(active) && !timedOut);
  const done = stages.filter((stage) => stage.state === "complete").length;
  const activeExpected = active ? expectedStageMs(active.id) : undefined;
  const activeElapsed = active?.startedAt ? now - active.startedAt : 0;
  const slow =
    !timedOut &&
    activeExpected !== undefined &&
    activeElapsed > activeExpected * SLOW_FACTOR;

  const announcement = (
    <p className="sr-only" aria-live="polite">
      {timedOut ? "Timed out" : active ? active.label : ""}
    </p>
  );

  if (variant === "compact") {
    return (
      <div data-slot="run-progress" className={cn("space-y-1.5", className)}>
        {/* No spinner of its own: the dock's row already shows the job's state. */}
        <div className="flex items-center gap-2 text-table">
          <span className="min-w-0 flex-1 truncate text-foreground">
            {timedOut
              ? "Timed out"
              : (active?.label ?? stages.at(-1)?.label ?? "")}
          </span>
          {active && (
            <span className="num shrink-0 text-muted-foreground">
              {formatDuration(activeElapsed)}
            </span>
          )}
        </div>
        <Meter value={done} max={stages.length} />
        {announcement}
      </div>
    );
  }

  return (
    <div data-slot="run-progress" className={cn("w-full space-y-3", className)}>
      <ol className="overflow-hidden rounded-(--card-radius) border border-border bg-card">
        {stages.map((stage) => {
          const expected = expectedStageMs(stage.id);
          return (
            <li
              key={stage.id}
              data-state={stage.state}
              className={cn(
                "flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0",
                stage.state === "active" && "bg-surface-inset",
              )}
            >
              <StageIcon state={stage.state} />
              <span
                className={cn(
                  "min-w-0 flex-1 text-body",
                  stage.state === "active"
                    ? "font-medium text-foreground"
                    : stage.state === "complete"
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {stage.label}
                <span className="sr-only">, {STATE_WORDS[stage.state]}</span>
              </span>
              <span
                className={cn(
                  "num shrink-0 text-data",
                  stage.state === "failed"
                    ? "text-danger-600"
                    : "text-muted-foreground",
                )}
              >
                {stageTime(stage, now, expected)}
              </span>
            </li>
          );
        })}
      </ol>
      {slow && active && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-body text-muted-foreground">
          <p>
            Still working. {active.label} usually takes about{" "}
            {formatDuration(activeExpected ?? 0)}.
          </p>
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      )}
      {timedOut && (
        <Notice tone="danger" title="Timed out">
          This run took too long and was stopped. Credits already used are not
          refunded; you can start it again.
        </Notice>
      )}
      {announcement}
    </div>
  );
}
