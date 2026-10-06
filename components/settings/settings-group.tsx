import type { ReactNode } from "react";

/**
 * A titled group inside a settings section, account or workspace, that isn't a form (a table, a list
 * of actions): the same heading and spacing as FormSection, under the page's own h1.
 */
export function SettingsGroup({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: ReactNode;
  /** One control beside the title: a refresh, or the group's one action. */
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-section">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}
