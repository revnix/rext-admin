import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The page's container inside the shell (design/app-language.md §5): gutters of 16, 24 and 32 px,
 * 24 px above and below, the content stopping at `--content-max` (lists, details, forms, settings)
 * or taking the full width (working surfaces). Only the five layouts render it; a page never writes
 * its own container.
 */
export type PageWidth = "content" | "full";

/** The page's side gutters: 16, 24 and 32 px. */
const GUTTERS = "px-4 md:px-6 xl:px-8";

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
        "mx-auto flex w-full min-w-0 flex-1 flex-col gap-8",
        GUTTERS,
        width === "content" && "max-w-(--content-max)",
        !flush && "py-6",
      )}
    >
      {children}
    </div>
  );
}

/**
 * A band above the page, in the shell, at the content's width and gutters: the shell's banner (a
 * failed renewal). The page's own frame keeps its space above, so the band needs none below.
 */
export function PageBand({ children }: { children: ReactNode }) {
  return (
    <div
      data-slot="page-band"
      className={cn(
        "mx-auto w-full min-w-0 max-w-(--content-max) pt-6",
        GUTTERS,
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
