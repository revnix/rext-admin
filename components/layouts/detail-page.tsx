import type { ReactNode } from "react";
import { PageBody, PageFrame } from "./page-frame";
import { PageHeader, type PageHeaderProps } from "./page-header";

export interface DetailPageProps extends Omit<PageHeaderProps, "hidden"> {
  /** The facts beside the main column from 1024 px, beneath it on narrower screens. */
  aside?: ReactNode;
  children: ReactNode;
}

/**
 * One thing: an article, a persona, a keyword (design/app-language.md §6). The header carries its title,
 * its status and its actions; the body is the main column, with an aside of facts when there is one.
 * Tabs, where the thing has facets, go in the main column.
 */
export function DetailPage({ aside, children, ...header }: DetailPageProps) {
  return (
    <PageFrame>
      <PageHeader {...header} />
      {aside ? (
        // content-start: PageBody grows to the window's height, and a grid stretches its rows to fill
        // it, which opened a gap between the main column and the aside on a short page on a phone.
        <PageBody className="grid content-start gap-8 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">{children}</div>
          <aside data-slot="detail-aside" className="min-w-0">
            {aside}
          </aside>
        </PageBody>
      ) : (
        <PageBody>{children}</PageBody>
      )}
    </PageFrame>
  );
}
