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
import { PageBody, PageFrame } from "./page-frame";
import { PageHeader, type PageHeaderProps } from "./page-header";

export interface WorkingSurfaceProps extends PageHeaderProps {
  /** The side pane: beside the main pane from 1024 px, a sheet behind a button on narrower screens. */
  side?: ReactNode;
  /** Names the side pane: its button and its sheet's title. */
  sideTitle?: string;
  /** No room above and below the surface. */
  flush?: boolean;
  /**
   * The surface draws the page's h1 itself (the editor's article title), so the layout draws no
   * header at all. The surface marks that h1 `layout-ok`.
   */
  ownHeading?: boolean;
  children: ReactNode;
}

/**
 * The full-width working surfaces: the outline, the editor, the calendar, the generation flow, the
 * chat later (design/app-language.md §6). A surface whose visible heading is its own passes `hidden`,
 * which keeps the page's h1 for screen readers. Panes inside the surface may scroll; nothing else does.
 */
export function WorkingSurface({
  side,
  sideTitle = "Details",
  flush = false,
  ownHeading = false,
  children,
  ...header
}: WorkingSurfaceProps) {
  return (
    <PageFrame width="full" flush={flush}>
      {!ownHeading && <PageHeader {...header} />}
      {side ? (
        <PageBody className="flex gap-6">
          <div className="min-w-0 flex-1">{children}</div>
          <aside
            aria-label={sideTitle}
            className="hidden w-80 shrink-0 lg:block"
          >
            {side}
          </aside>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="fixed right-4 bottom-[calc(var(--bottom-bar-height,0px)+1rem)] z-(--z-sticky) lg:hidden"
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
        </PageBody>
      ) : (
        <PageBody>{children}</PageBody>
      )}
    </PageFrame>
  );
}
