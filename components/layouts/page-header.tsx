import type { ReactNode } from "react";

export interface PageHeaderProps {
  /** The page's one `h1`. */
  title: string;
  description?: ReactNode;
  /** Beside the title: a status badge, a count. */
  status?: ReactNode;
  /** On the right from 640 px, under the title on a phone: the page's actions, the primary one last. */
  actions?: ReactNode;
  /**
   * The page draws its title itself (a working surface's own heading): the `h1` stays for screen
   * readers and the header takes no room.
   */
  hidden?: boolean;
}

/**
 * The header of every page (design/app-language.md §5 and §6): the title in the page-title role,
 * an optional status beside it, the description beneath, the actions on the right.
 */
export function PageHeader({
  title,
  description,
  status,
  actions,
  hidden = false,
}: PageHeaderProps) {
  if (hidden) return <h1 className="sr-only">{title}</h1>;

  return (
    <header
      data-slot="page-header"
      className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="font-display text-page-title text-foreground">
            {title}
          </h1>
          {status}
        </div>
        {description && (
          <p className="max-w-2xl text-body text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
