import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  title: string;
  hideTitle?: boolean;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

/**
 * A page's container and header. The sidebar, the header bar and the dock come from the route
 * layouts now (`components/shell`); task C2 replaces this with the five page layouts of
 * design/app-language.md §6. Gutters are 16, 24 and 32 px (§5); lists and forms stop at
 * `--content-max`, working surfaces take `fullWidth`.
 */
export function PageLayout({
  title,
  hideTitle = false,
  description,
  actions,
  children,
  className,
  fullWidth = false,
}: PageLayoutProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full min-w-0 flex-1 flex-col gap-8 px-4 py-6 md:px-6 xl:px-8",
        !fullWidth && "max-w-(--content-max)",
        className,
      )}
    >
      {!hideTitle && (
        <PageHeader title={title} description={description} actions={actions} />
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
