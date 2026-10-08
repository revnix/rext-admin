"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { Button } from "@/components/ui/button";
import { log } from "@/lib/logger";
import type { RunView } from "@/lib/generate-content/run-findings";
import type { RunStage } from "@/lib/generate-content/run-stages";
import { withoutLists } from "@/lib/generate-content/step-fill";
import { cn } from "@/lib/utils";
import { RunProgress } from "./run-progress";

export interface FillProgressProps {
  stages: RunStage[];
  /** The run's title, lines and footer (run-findings.ts' `describeRun`). */
  view: RunView;
  onCancel?: () => void;
  className?: string;
}

/**
 * The run's stages beside a step that is filling in (rext-control#694, the second pass): the wait's
 * own box, without the lists under its stages, which the step shows itself. It heads the step's side
 * pane from 1024 px.
 */
export function FillProgressBox({
  stages,
  view,
  onCancel,
  className,
}: FillProgressProps) {
  return (
    <RunProgress
      stages={stages}
      header={view.header}
      details={withoutLists(view.details)}
      footer={view.footer}
      onCancel={onCancel}
      className={className}
    />
  );
}

/**
 * The same stages under 1024 px, where the side pane is out of sight: one line above the step (the
 * stage running, its time, and what it says), with the whole list behind "All steps".
 */
export function FillProgressStrip({
  stages,
  view,
  onCancel,
  className,
}: FillProgressProps) {
  const [open, setOpen] = useState(false);
  const active = stages.find((stage) => stage.state === "active");
  const line = active ? view.details[active.id]?.live : undefined;
  return (
    <div className={cn("space-y-2 lg:hidden", className)}>
      {open ? (
        <FillProgressBox stages={stages} view={view} onCancel={onCancel} />
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

/**
 * A step's filling view is an extra over the wait's own box: if it throws, the box alone takes its
 * place and the run goes on. The shared ErrorBoundary would put a danger notice with "Try again"
 * where a wait belongs.
 */
export function FillBoundary({
  fallback,
  children,
}: {
  fallback: ReactNode;
  children: ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={fallback}
      onError={(error, info) =>
        log.error("A step's filling view threw:", {
          message: error instanceof Error ? error.message : String(error),
          componentStack: info.componentStack,
        })
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * A filling wait is a new screen, and a long one: it starts at its top. The step before it ends on
 * a button at the foot of its page, and the scroll would else stay there, with the steps row and
 * the wait's first lines out of sight. Mounted once per wait (give it the phase as its key).
 */
export function StartAtTop() {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    // Whichever ancestor scrolls (the shell's main column, or the window on a phone).
    for (
      let node = anchor.current?.parentElement;
      node;
      node = node.parentElement
    ) {
      if (node.scrollTop > 0) node.scrollTop = 0;
    }
    if (window.scrollY > 0) window.scrollTo(0, 0);
  }, []);
  return <span ref={anchor} hidden />;
}
