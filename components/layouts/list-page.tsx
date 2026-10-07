import type { ReactNode } from "react";
import { PageBody, PageFrame } from "./page-frame";
import { PageHeader, type PageHeaderProps } from "./page-header";

export interface ListPageProps extends Omit<PageHeaderProps, "hidden"> {
  /** Above the list: search, filters, the view toggle. */
  toolbar?: ReactNode;
  children: ReactNode;
}

/**
 * A list of things: content, personas, keywords, members, invoices, logs (design/app-language.md §6).
 * The header with its actions, an optional toolbar, then the table or the card grid, its empty state
 * and its pagination as the children.
 */
export function ListPage({ toolbar, children, ...header }: ListPageProps) {
  return (
    <PageFrame>
      <PageHeader {...header} />
      <PageBody className="flex flex-col gap-4">
        {toolbar && (
          <div
            data-slot="list-toolbar"
            className="flex flex-wrap items-center gap-2"
          >
            {toolbar}
          </div>
        )}
        {children}
      </PageBody>
    </PageFrame>
  );
}
