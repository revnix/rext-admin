import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * When there is nothing to show (design/app-language.md §8): a title, one sentence, one action, and
 * no illustration. Lists put it outside the table (the DataTable's `emptyState`). Pages outside the
 * shell (404, errors, maintenance) make the title their `h1`.
 */
export function EmptyState({
  title,
  description,
  action,
  eyebrow,
  as: Heading = "h2",
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** The one way forward: a link, a handler, or a node of its own. */
  action?:
    | { label: string; href: string; variant?: "default" | "outline" }
    | { label: string; onClick: () => void; variant?: "default" | "outline" }
    | ReactNode;
  /** A short line above the title, such as an error code. */
  eyebrow?: ReactNode;
  /** The title's heading level: h1 on a page with no other heading. */
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center gap-2 px-6 py-12 text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="num font-mono text-label text-muted-foreground">
          {eyebrow}
        </p>
      )}
      <Heading
        className={cn(
          "text-foreground",
          Heading === "h1" ? "font-display text-page-title" : "text-section",
        )}
      >
        {title}
      </Heading>
      {description && (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{renderAction(action)}</div>}
    </div>
  );
}

type ActionProp = NonNullable<Parameters<typeof EmptyState>[0]["action"]>;

function renderAction(action: ActionProp) {
  if (typeof action === "object" && action !== null && "label" in action) {
    const variant = action.variant ?? "default";
    if ("href" in action) {
      return (
        <Button asChild variant={variant}>
          <Link href={action.href as Route}>{action.label}</Link>
        </Button>
      );
    }
    return (
      <Button variant={variant} onClick={action.onClick}>
        {action.label}
      </Button>
    );
  }
  return action as ReactNode;
}
