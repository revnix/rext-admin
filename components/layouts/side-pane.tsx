"use client";

import { PanelRight } from "lucide-react";
import { createContext, type ReactNode, useContext } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface WithSidePaneProps {
  /** The side pane: beside the main column from 1024 px, a sheet behind a button on narrower screens. */
  side: ReactNode;
  /** Names the side pane: its landmark, its button and its sheet's title. */
  sideTitle?: string;
  /**
   * Shows the title above the pane on wide screens too (the sheet always shows it), for content
   * with no heading of its own.
   */
  showTitle?: boolean;
  /**
   * Where the button that opens the sheet sits under 1024 px: floating at the bottom right, above
   * the bottom bar and the run dock (the default), or in the main column's own flow, where the page
   * renders `SidePaneTrigger` itself (the outline step, whose right-aligned approve buttons end the
   * page, where a floating button would cover them).
   */
  trigger?: "floating" | "inline";
  className?: string;
  children: ReactNode;
}

const SidePaneTitle = createContext<string | null>(null);

/**
 * A main column with a side pane, the working surfaces' two-pane shape (design/app-language.md §6):
 * WorkingSurface renders it for a page's side pane, and a step inside a surface (the Generate flow's
 * evidence beside its suggestions) renders it for its own.
 */
export function WithSidePane({
  side,
  sideTitle = "Details",
  showTitle = false,
  trigger = "floating",
  className,
  children,
}: WithSidePaneProps) {
  return (
    <SidePaneTitle.Provider value={sideTitle}>
      <Sheet>
        <div className={cn("flex gap-6", className)}>
          <div className="min-w-0 flex-1">{children}</div>
          <aside
            aria-label={sideTitle}
            className="hidden w-80 shrink-0 lg:block"
          >
            {showTitle && (
              <h2 className="mb-3 text-sm font-medium text-foreground">
                {sideTitle}
              </h2>
            )}
            {side}
          </aside>
          {trigger === "floating" && (
            <SidePaneTrigger className="fixed right-4 bottom-[calc(var(--bottom-bar-height,0px)+var(--dock-height,0px)+--spacing(4))] z-(--z-sticky)" />
          )}
          <SheetContent side="right" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{sideTitle}</SheetTitle>
              <SheetDescription className="sr-only">
                The side pane of this page.
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-4">{side}</div>
          </SheetContent>
        </div>
      </Sheet>
    </SidePaneTitle.Provider>
  );
}

/**
 * The button that opens a WithSidePane's sheet under 1024 px; hidden from 1024 px, where the pane is
 * beside the column. WithSidePane renders it floating; with `trigger="inline"` the page renders it
 * inside the main column, where it belongs in the page's flow.
 */
export function SidePaneTrigger({
  size = "sm",
  className,
}: {
  size?: "default" | "sm";
  className?: string;
}) {
  const title = useContext(SidePaneTitle);
  if (title === null) {
    throw new Error("SidePaneTrigger renders inside a WithSidePane.");
  }
  return (
    <SheetTrigger asChild>
      <Button
        variant="outline"
        size={size}
        className={cn("lg:hidden", className)}
      >
        <PanelRight />
        {title}
      </Button>
    </SheetTrigger>
  );
}
