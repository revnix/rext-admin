import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/** Creating a workspace is three moments: the address, the reading, the review. */
export const CREATION_STEPS = [
  "Your website",
  "Reading the site",
  "Review and finish",
] as const;

/** The same three for a workspace made from a description of the business (rext-control#853). */
export const CREATION_STEPS_WITHOUT_SITE = [
  "Your business",
  "Drafting the voice",
  "Review and finish",
] as const;

/**
 * Where one is in creating a workspace (rext-control#845): the three steps in a row, the ones done
 * with a tick, the current one filled, the rest hollow, as the Generate flow's own row marks its
 * six. Under 30 rem of its own width only the current step is named.
 */
export function CreationSteps({
  current,
  withoutSite = false,
}: {
  current: 0 | 1 | 2;
  /** The workspace is made from a description: there is no site to read. */
  withoutSite?: boolean;
}) {
  const steps = withoutSite ? CREATION_STEPS_WITHOUT_SITE : CREATION_STEPS;
  return (
    <nav
      aria-label="Workspace steps"
      className="@container border-b border-border pb-4"
    >
      <ol className="flex items-start gap-3">
        {steps.map((label, index) => {
          const state =
            index < current
              ? "done"
              : index === current
                ? "current"
                : "not-started";
          return (
            <li
              key={label}
              aria-current={state === "current" ? "step" : undefined}
              data-state={state}
              className={cn(
                "flex min-w-0 items-center gap-2",
                state === "current" ? "shrink-0" : "@max-[30rem]:shrink-0",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "num grid size-6 shrink-0 place-items-center rounded-full text-caption font-semibold",
                  state === "done" &&
                    "border border-border-strong bg-surface-inset text-foreground",
                  state === "current" && "bg-primary text-primary-foreground",
                  state === "not-started" &&
                    "border border-dashed border-border-strong bg-surface-raised text-muted-foreground",
                )}
              >
                {state === "done" ? <Check className="size-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  "truncate text-table",
                  state === "current"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground @max-[30rem]:sr-only",
                )}
              >
                {label}
                <span className="sr-only">
                  {state === "done"
                    ? ", done"
                    : state === "current"
                      ? ", current step"
                      : ", not started"}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
