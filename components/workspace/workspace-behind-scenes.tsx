"use client";

import { useState } from "react";

import { RunProgress } from "@/components/generate-content/run-progress";
import { Button } from "@/components/ui/button";
import type {
  RunStage,
  RunStageDetail,
} from "@/lib/generate-content/run-stages";
import type { WorkspaceActivity } from "@/lib/workspace/workspace-run-stages";
import { cn } from "@/lib/utils";

export interface BehindTheScenesProps {
  stages: RunStage[];
  /** What each stage will do, is doing and found (`workspaceStageDetails`). */
  details: Record<string, RunStageDetail>;
  /** What the analysis has reported, newest first (`workspaceActivity`). */
  activity: WorkspaceActivity[];
  /** Above the stages: what this is, before anything runs. */
  intro?: string;
  className?: string;
}

/**
 * Behind the scenes of creating a workspace (rext-control#845): the analysis's three stages with
 * their times and what each found, and under them the work as it happens, newest on top. Before
 * the workspace is created it is the plan: the same three stages, each waiting, with what it will
 * do and about how long it takes. It sits beside the workspace's parts from 1024 px.
 */
export function BehindTheScenes({
  stages,
  details,
  activity,
  intro,
  className,
}: BehindTheScenesProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {intro && <p className="text-table text-muted-foreground">{intro}</p>}
      <RunProgress stages={stages} details={details} />
      <ActivityList activity={activity} />
    </div>
  );
}

/**
 * The same under 1024 px, where nothing sits beside anything: one line above the parts (the stage
 * running, its time, and the newest thing it reported), with the stages and the whole list behind
 * "All steps".
 */
export function BehindTheScenesStrip({
  stages,
  details,
  activity,
  className,
}: BehindTheScenesProps) {
  const [open, setOpen] = useState(false);
  const active = stages.find((stage) => stage.state === "active");
  // The newest thing the running stage reported, else what it is doing.
  const line =
    activity.find((item) => item.kind === "progress")?.text ??
    (active ? details[active.id]?.live : undefined);
  return (
    <div className={cn("space-y-2 lg:hidden", className)}>
      {open ? (
        <BehindTheScenes
          stages={stages}
          details={details}
          activity={activity}
        />
      ) : (
        <div className="space-y-1.5 rounded-(--card-radius) border border-border bg-card p-3">
          <RunProgress stages={stages} variant="compact" />
          {line && <p className="text-caption text-muted-foreground">{line}</p>}
        </div>
      )}
      <Button
        data-rec="show"
        variant="ghost"
        size="sm"
        aria-expanded={open}
        onClick={() => setOpen((shown) => !shown)}
      >
        {open ? "Hide steps" : "All steps"}
      </Button>
    </div>
  );
}

/** "0:07" from the run's first report to this one. */
function sinceStart(at: number | undefined, start: number | undefined) {
  if (at === undefined || start === undefined) return null;
  const seconds = Math.max(0, Math.round((at - start) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** The work as it happens, newest on top: each line as the run reported it, with its time. */
function ActivityList({ activity }: { activity: WorkspaceActivity[] }) {
  if (activity.length === 0) return null;
  const start = activity[activity.length - 1]?.at;
  return (
    <section aria-label="As it happens" className="flex flex-col gap-2">
      <h3 className="text-label text-foreground">As it happens</h3>
      <ol
        aria-live="polite"
        className="flex flex-col divide-y divide-border rounded-md border border-border bg-card"
      >
        {activity.map((item, index) => {
          const time = sinceStart(item.at, start);
          return (
            <li
              key={item.id}
              className={cn(
                "flex gap-3 px-3 py-2 text-table",
                // The newest line arrives; the rest have been read.
                index === 0
                  ? "text-foreground animate-in fade-in-0 slide-in-from-top-1 duration-(--duration-base) motion-reduce:animate-none"
                  : "text-muted-foreground",
              )}
            >
              {time && (
                <span className="num w-9 shrink-0 text-muted-foreground">
                  {time}
                </span>
              )}
              <span
                className={cn(
                  "min-w-0 wrap-anywhere",
                  item.kind === "done" && "font-medium text-foreground",
                  item.kind === "failed" && "font-medium text-destructive",
                )}
              >
                {item.text}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
