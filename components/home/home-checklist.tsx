import { Check, ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Meter } from "@/components/ui/meter";
import { cn } from "@/lib/utils";
import type { ChecklistStep, ChecklistStepId } from "./home-data";

/**
 * Getting started (plans/app/D-pages.md §2.1): the five steps to a first published article, each
 * linking to where it's done, until every one is. The page hides it then. A step with no link (one
 * the person may not do here, such as generating without `content.create`) is listed as text.
 */
export function HomeChecklist({
  steps,
  hrefs,
}: {
  steps: ChecklistStep[];
  hrefs: Partial<Record<ChecklistStepId, string>>;
}) {
  const done = steps.filter((step) => step.done).length;
  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-card p-5">
      <div className="flex flex-col gap-2">
        <p className="num text-sm text-muted-foreground">
          {done} of {steps.length} done
        </p>
        <Meter
          value={done}
          max={steps.length}
          label="Getting started"
          className="max-w-xs"
        />
      </div>
      <ol className="flex flex-col divide-y divide-border">
        {steps.map((step) => {
          const href = hrefs[step.id];
          const row = (
            <>
              <span
                aria-hidden
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border",
                  step.done
                    ? "border-foreground bg-foreground text-background"
                    : "border-border",
                )}
              >
                {step.done && <Check className="size-4" />}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span
                  className={cn(
                    "text-sm font-medium",
                    step.done
                      ? "text-muted-foreground line-through"
                      : "text-foreground",
                  )}
                >
                  {step.label}
                  <span className="sr-only">
                    {step.done ? " (done)" : " (to do)"}
                  </span>
                </span>
                {!step.done && (
                  <span className="text-sm text-muted-foreground">
                    {step.description}
                  </span>
                )}
              </span>
              {href && (
                <ChevronRight
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              )}
            </>
          );
          return (
            <li key={step.id}>
              {href ? (
                <Link
                  href={href as Route}
                  className="group flex items-center gap-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {row}
                </Link>
              ) : (
                <div className="flex items-center gap-3 py-3">{row}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
