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
 * Retired: every page renders one of the five layouts in components/layouts. This is kept only for
 * the old topic-based content wizard (app/w/[workspaceSlug]/content/create), which the founder has
 * retired; task E14 deletes the wizard, this file and components/page-header.tsx together.
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
