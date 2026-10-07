import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The Generate flow's step column inside its WorkingSurface (plans/app/E-workflow.md §4): a step's
 * reading width, or, for a step that shows its evidence beside it in a WithSidePane, the room for a
 * main column beside the 320 px pane.
 */
export function StepColumn({
  withSidePane = false,
  className,
  children,
}: {
  withSidePane?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        withSidePane ? "max-w-6xl" : "max-w-3xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
