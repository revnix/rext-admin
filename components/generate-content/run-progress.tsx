"use client";

import { Check, Circle, Loader2, Minus, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Notice } from "@/components/ui/notice";
import type {
  RunHeader,
  RunStage,
  RunStageDetail,
  RunStageItems,
  RunStageState,
  RunTitleRow,
} from "@/lib/generate-content/run-stages";
import {
  expectedStageMs,
  formatDuration,
} from "@/lib/generate-content/run-timings";
import { cn } from "@/lib/utils";

/** Past this share of its usual time, an active stage says it is still working. */
const SLOW_FACTOR = 1.5;

/** A row or a found thing arriving: a 200 ms fade, none under reduced motion (design language §10). */
const ARRIVE =
  "animate-in fade-in-0 slide-in-from-bottom-1 duration-(--duration-base) motion-reduce:animate-none";

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
  const place = "mt-0.5 size-4 shrink-0";
  switch (state) {
    case "complete":
      return <Check className={cn(place, "text-foreground")} aria-hidden />;
    case "active":
      return (
        <Loader2
          className={cn(
            place,
            "animate-spin text-primary motion-reduce:animate-none",
          )}
          aria-hidden
        />
      );
    case "failed":
      return <X className={cn(place, "text-danger-600")} aria-hidden />;
    case "skipped":
      return (
        <Minus className={cn(place, "text-muted-foreground")} aria-hidden />
      );
    default:
      return (
        <Circle className={cn(place, "text-muted-foreground")} aria-hidden />
      );
  }
}

const STATE_WORDS: Record<RunStageState, string> = {
  pending: "waiting",
  active: "running",
  complete: "done",
  failed: "failed",
  skipped: "skipped",
};

/** What the stage's time column says: a running stage's time against its usual one. */
function StageTime({
  stage,
  now,
  expected,
}: {
  stage: RunStage;
  now: number;
  expected?: number;
}) {
  if (stage.state === "failed") return "Failed";
  if (stage.state === "skipped") return "Skipped";
  if (stage.state === "pending") {
    return expected ? `about ${formatDuration(expected)}` : "";
  }
  // A stage seen only from outside (the dock) may have no times: say nothing rather than "0 s".
  if (!stage.startedAt) return "";
  const end = stage.state === "complete" ? (stage.endedAt ?? now) : now;
  const elapsed = formatDuration(end - stage.startedAt);
  if (stage.state !== "active" || !expected) return elapsed;
  return (
    <>
      <span className="text-foreground">{elapsed}</span> of about{" "}
      {formatDuration(expected)}
    </>
  );
}

/** "0:17": the run's clock, minutes and seconds. */
function clockText(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * What the live region says (design language §11): the stage that started, after the result line of
 * the one that finished just before it, once each. A stage that ends with no result line says nothing.
 */
function announcement(
  stages: RunStage[],
  details: Record<string, RunStageDetail> | undefined,
): string {
  let last: RunStage | undefined;
  for (const stage of stages) {
    if (
      stage.state === "complete" &&
      (!last || (stage.endedAt ?? 0) >= (last.endedAt ?? 0))
    ) {
      last = stage;
    }
  }
  const result = last ? details?.[last.id]?.result : undefined;
  const active = stages.find((stage) => stage.state === "active");
  return [
    last && result
      ? `${last.label}, done: ${result.replaceAll(" · ", ", ")}`
      : "",
    active?.label ?? "",
  ]
    .filter(Boolean)
    .join(". ");
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
  /** A title over the stages, with the run's clock, its usual total and a bar of the stages done. */
  header?: RunHeader;
  /** What each stage will do, is doing and found, by stage id (run-findings.ts' `describeRun`). */
  details?: Record<string, RunStageDetail>;
  /** A last line inside the box: that the user may leave the page, say. */
  footer?: string;
}

/**
 * A run as named stages (design/app-language.md §8): each one waiting, running, done, failed or
 * skipped, with its time; the running one against its usual time, and "still working" with Cancel
 * once it takes 1.5 times that. With `details` it says what it found (rext-control#694): a waiting
 * stage what it will do, in grey; the running one its live line and the things it is working on; a
 * finished one its result line. A live region announces each stage as it starts and each finished
 * stage's result line once.
 */
export function RunProgress({
  stages,
  variant = "expanded",
  timedOut = false,
  onCancel,
  className,
  header,
  details,
  footer,
}: RunProgressProps) {
  const titleId = useId();
  const active = stages.find((stage) => stage.state === "active");
  const now = useNow(Boolean(active) && !timedOut);
  const done = stages.filter((stage) => stage.state === "complete").length;
  const activeExpected = active ? expectedStageMs(active.id) : undefined;
  const activeElapsed = active?.startedAt ? now - active.startedAt : 0;
  const slow =
    !timedOut &&
    activeExpected !== undefined &&
    activeElapsed > activeExpected * SLOW_FACTOR;

  const live = (
    <p className="sr-only" aria-live="polite">
      {timedOut ? "Timed out" : announcement(stages, details)}
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
        {live}
      </div>
    );
  }

  return (
    <div data-slot="run-progress" className={cn("w-full space-y-3", className)}>
      <section
        aria-labelledby={header ? titleId : undefined}
        className="overflow-hidden rounded-(--card-radius) border border-border bg-card"
      >
        {header && (
          <RunHeading
            header={header}
            stages={stages}
            details={details}
            now={now}
            titleId={titleId}
          />
        )}
        <ol className={cn(header && "border-t border-border")}>
          {stages.map((stage) => (
            <StageRow
              key={stage.id}
              stage={stage}
              detail={details?.[stage.id]}
              now={now}
            />
          ))}
        </ol>
        {footer && (
          <p className="border-t border-border px-4 py-3 text-table text-muted-foreground">
            {footer}
          </p>
        )}
      </section>
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
      {live}
    </div>
  );
}

/** The run's title, its clock (mono) and usual total, and the bar of the stages done. */
function RunHeading({
  header,
  stages,
  details,
  now,
  titleId,
}: {
  header: RunHeader;
  stages: RunStage[];
  details?: Record<string, RunStageDetail>;
  now: number;
  titleId: string;
}) {
  const running = stages.some((stage) => stage.state === "active");
  const ended = Math.max(0, ...stages.map((stage) => stage.endedAt ?? 0));
  const elapsed =
    header.startedAt !== undefined
      ? (running || !ended ? now : ended) - header.startedAt
      : undefined;
  const expected = stages.map((stage) => expectedStageMs(stage.id));
  const usual = expected.every((ms) => ms !== undefined)
    ? expected.reduce<number>((sum, ms) => sum + (ms ?? 0), 0)
    : undefined;

  // The bar counts finished stages, and inside the running one what it has done (titles written).
  const done = stages.filter((stage) => stage.state === "complete").length;
  const active = stages.find((stage) => stage.state === "active");
  const within = active ? details?.[active.id]?.progress : undefined;
  const share =
    within && within.total > 0 ? Math.min(within.done / within.total, 1) : 0;
  const percent = stages.length
    ? Math.round(((done + share) / stages.length) * 100)
    : 0;
  const words = within
    ? `${within.done} of ${within.total} ${within.label}`
    : `${done} of ${stages.length} steps done`;

  return (
    <>
      <header className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 id={titleId} className="text-section break-words">
            {header.title}
          </h2>
          {header.subtitle && (
            <p className="break-words text-table text-muted-foreground">
              {header.subtitle}
            </p>
          )}
        </div>
        {(elapsed !== undefined || usual !== undefined) && (
          <p className="flex shrink-0 items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0">
            {elapsed !== undefined && (
              <span
                role="timer"
                aria-label={`${Math.max(0, Math.floor(elapsed / 1000))} seconds so far`}
                className="num font-mono text-section font-medium tracking-normal"
              >
                {clockText(elapsed)}
              </span>
            )}
            {usual !== undefined && (
              <span className="text-table text-muted-foreground">
                usually about {formatDuration(usual)}
              </span>
            )}
          </p>
        )}
      </header>
      <div className="px-4 pb-4">
        {/* Drawn here: the Meter is a measure in the text colour, and the Progress primitive hands
            assistive technology no value. This bar is progress, in the accent, said in words. */}
        <div
          role="progressbar"
          aria-label="Progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={words}
          className="h-1 overflow-hidden rounded-full bg-surface-inset"
        >
          <div
            className="h-full w-full rounded-full bg-primary transition-transform duration-(--duration-slow) ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${100 - percent}%)` }}
          />
        </div>
      </div>
    </>
  );
}

function StageRow({
  stage,
  detail,
  now,
}: {
  stage: RunStage;
  detail?: RunStageDetail;
  now: number;
}) {
  const expected = expectedStageMs(stage.id);
  const line =
    stage.state === "pending"
      ? detail?.waiting
      : stage.state === "active"
        ? detail?.live
        : stage.state === "complete"
          ? detail?.result
          : undefined;
  const items =
    stage.state === "active" || stage.state === "complete"
      ? detail?.items
      : undefined;
  return (
    <li
      data-state={stage.state}
      className={cn(
        "flex gap-3 border-b border-border px-4 py-3 last:border-b-0",
        stage.state === "active" && "bg-surface-inset",
      )}
    >
      <StageIcon state={stage.state} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <span
            className={cn(
              "min-w-0 text-body",
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
            <StageTime stage={stage} now={now} expected={expected} />
          </span>
        </div>
        {line && (
          <p
            className={cn(
              "num break-words text-table",
              stage.state === "pending"
                ? "text-muted-foreground"
                : "text-foreground",
            )}
          >
            {line}
          </p>
        )}
        {items && <StageItems items={items} />}
      </div>
    </li>
  );
}

function StageItems({ items }: { items: RunStageItems }) {
  switch (items.kind) {
    case "results":
      return <ResultList items={items.items} preview={items.preview} />;
    case "chips":
      return (
        <ul className="flex flex-wrap gap-1.5">
          {items.items.map((item) => (
            <li
              key={item}
              className={cn(
                "inline-flex h-6 max-w-full items-center truncate rounded-full border border-border bg-card px-2 text-table text-foreground",
                ARRIVE,
              )}
            >
              {item}
            </li>
          ))}
        </ul>
      );
    case "titles":
      return (
        <ol className="divide-y divide-border">
          {items.rows.map((row, index) => (
            <TitleRow
              // A row's place is its identity: the title in it grows as it is written.
              // biome-ignore lint/suspicious/noArrayIndexKey: rows only ever append
              key={index}
              row={row}
              position={index + 1}
            />
          ))}
        </ol>
      );
    case "lines":
      return (
        <ol className="space-y-1">
          {items.items.map((item, index) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: lines only ever append
              key={index}
              className={cn("flex gap-2.5 text-table text-foreground", ARRIVE)}
            >
              <span className="num w-5 shrink-0 text-right font-mono text-muted-foreground">
                {index + 1}
              </span>
              <span className="min-w-0 break-words">{item}</span>
            </li>
          ))}
        </ol>
      );
  }
}

/** The first results, with the rest a click away. */
function ResultList({
  items,
  preview,
}: {
  items: { position: number; title: string; site: string }[];
  preview: number;
}) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, preview);
  return (
    <div className="space-y-1">
      <ol className="divide-y divide-border">
        {shown.map((result, index) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: two results can share a position
            key={`${result.position}-${index}`}
            className={cn("flex min-w-0 items-baseline gap-2.5 py-1.5", ARRIVE)}
          >
            <span className="num w-5 shrink-0 text-right font-mono text-data text-muted-foreground">
              {result.position}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-table text-foreground">
                {result.title}
              </span>
              {result.site && (
                <span className="block truncate text-caption text-muted-foreground">
                  {result.site}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
      {items.length > preview && (
        <button
          type="button"
          className="link inline-flex min-h-6 items-center text-table"
          aria-expanded={all}
          onClick={() => setAll((open) => !open)}
        >
          {all ? `Show the top ${preview}` : `Show all ${items.length} results`}
        </button>
      )}
    </div>
  );
}

/** A title as it is written: its checks once it is whole, "Being written" while it grows, "Next". */
function TitleRow({ row, position }: { row: RunTitleRow; position: number }) {
  return (
    <li className={cn("flex gap-2.5 py-2", ARRIVE)}>
      <span className="num w-5 shrink-0 pt-px text-right font-mono text-data text-muted-foreground">
        {position}
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        {row.title && (
          <p
            className={cn(
              "break-words text-body",
              row.state === "next"
                ? "text-muted-foreground"
                : "font-medium text-foreground",
            )}
          >
            {row.title}
            {row.state === "writing" && (
              <span className="text-muted-foreground" aria-hidden>
                …
              </span>
            )}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
          {row.state === "written" ? (
            <>
              {row.checks.map((check) => (
                <span
                  key={check.label}
                  className="num inline-flex items-center gap-1"
                >
                  {check.met ? (
                    <Check className="size-4 text-foreground" aria-hidden />
                  ) : (
                    <X className="size-4" aria-hidden />
                  )}
                  {check.label}
                </span>
              ))}
              {row.recommended && <Badge>Recommended</Badge>}
            </>
          ) : row.state === "writing" ? (
            "Being written"
          ) : (
            "Next"
          )}
        </div>
        {row.reason && (
          <p className="text-caption text-muted-foreground">{row.reason}</p>
        )}
      </div>
    </li>
  );
}
