import type { ReactNode } from "react";
import { PageBody, PageFrame } from "./page-frame";
import { PageHeader, type PageHeaderProps } from "./page-header";

export interface FormPageProps extends Omit<PageHeaderProps, "hidden"> {
  /**
   * The header and the form centred together in the content area, for a flow the person does on
   * its own (creating a workspace): no gap left on one side.
   */
  centered?: boolean;
  children: ReactNode;
}

/**
 * Create and edit (design/app-language.md §5 and §6): the header, then the form in one column that
 * stops at `--form-max` (560 px). The field set and the sticky submit row are the form's own (C4).
 */
export function FormPage({
  children,
  centered = false,
  ...header
}: FormPageProps) {
  if (centered) {
    return (
      <PageFrame>
        <div
          data-slot="form-column"
          className="mx-auto flex w-full max-w-(--form-max) flex-col gap-8"
        >
          <PageHeader {...header} />
          <PageBody>{children}</PageBody>
        </div>
      </PageFrame>
    );
  }
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
