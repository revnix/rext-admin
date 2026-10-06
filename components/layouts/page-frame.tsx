import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The page's container inside the shell (design/app-language.md §5): gutters of 16, 24 and 32 px,
 * 24 px above and below, the content stopping at `--content-max` (lists, details, forms, settings)
 * or taking the full width (working surfaces). Only the five layouts render it; a page never writes
 * its own container.
 */
export type PageWidth = "content" | "full";

export function PageFrame({
  width = "content",
  flush = false,
  children,
}: {
  width?: PageWidth;
  /** No room above and below: a working surface that runs from the header to the bottom edge. */
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      data-slot="page"
      data-width={width}
      className={cn(
        "mx-auto flex w-full min-w-0 flex-1 flex-col gap-8 px-4 md:px-6 xl:px-8",
        width === "content" && "max-w-(--content-max)",
        !flush && "py-6",
      )}
    >
      {children}
    </div>
  );
}

/** The page's body under the header: it grows, and never pushes the page sideways. */
export function PageBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("min-w-0 flex-1", className)}>{children}</div>;
}
