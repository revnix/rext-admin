"use client";

import { PanelRight } from "lucide-react";
import type { ReactNode } from "react";

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
  className?: string;
  children: ReactNode;
}

/**
 * A main column with a side pane, the working surfaces' two-pane shape (design/app-language.md §6):
 * WorkingSurface renders it for a page's side pane, and a step inside a surface (the Generate flow's
 * evidence beside its suggestions) renders it for its own.
 */
export function WithSidePane({
  side,
  sideTitle = "Details",
  className,
  children,
}: WithSidePaneProps) {
  return (
    <div className={cn("flex gap-6", className)}>
      <div className="min-w-0 flex-1">{children}</div>
      <aside aria-label={sideTitle} className="hidden w-80 shrink-0 lg:block">
        {side}
      </aside>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="fixed right-4 bottom-[calc(var(--bottom-bar-height,0px)+--spacing(4))] z-(--z-sticky) lg:hidden"
          >
            <PanelRight />
            {sideTitle}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{sideTitle}</SheetTitle>
            <SheetDescription className="sr-only">
              The side pane of this page.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">{side}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
