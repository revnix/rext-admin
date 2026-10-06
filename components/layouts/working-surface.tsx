"use client";

import type { ReactNode } from "react";

import { PageBody, PageFrame } from "./page-frame";
import { PageHeader, type PageHeaderProps } from "./page-header";
import { WithSidePane } from "./side-pane";

export interface WorkingSurfaceProps extends PageHeaderProps {
  /** The side pane: beside the main pane from 1024 px, a sheet behind a button on narrower screens. */
  side?: ReactNode;
  /** Names the side pane: its button and its sheet's title. */
  sideTitle?: string;
  /** Shows that name above the pane on wide screens too, for a pane with no heading of its own. */
  showSideTitle?: boolean;
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
  showSideTitle = false,
  flush = false,
  ownHeading = false,
  children,
  ...header
}: WorkingSurfaceProps) {
  return (
    <PageFrame width="full" flush={flush}>
      {!ownHeading && <PageHeader {...header} />}
      {side ? (
        <PageBody>
          <WithSidePane
            side={side}
            sideTitle={sideTitle}
            showTitle={showSideTitle}
          >
            {children}
          </WithSidePane>
        </PageBody>
      ) : (
        <PageBody>{children}</PageBody>
      )}
    </PageFrame>
  );
}
