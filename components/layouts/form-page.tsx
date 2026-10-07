import type { ReactNode } from "react";
import { PageBody, PageFrame } from "./page-frame";
import { PageHeader, type PageHeaderProps } from "./page-header";

export interface FormPageProps extends Omit<PageHeaderProps, "hidden"> {
  children: ReactNode;
}

/**
 * Create and edit (design/app-language.md §5 and §6): the header, then the form in one column that
 * stops at `--form-max` (560 px). The field set and the sticky submit row are the form's own (C4).
 */
export function FormPage({ children, ...header }: FormPageProps) {
  return (
    <PageFrame>
      <PageHeader {...header} />
      <PageBody>
        <div data-slot="form-column" className="max-w-(--form-max)">
          {children}
        </div>
      </PageBody>
    </PageFrame>
  );
}
