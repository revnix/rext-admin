"use client";

import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** One item in a row's `…` menu. */
export interface DataTableRowAction {
  label: string;
  icon?: LucideIcon;
  /** A link, for an action that opens a page. */
  href?: string;
  /** Called when chosen; a destructive action asks first (`useConfirmation`). */
  onSelect?: () => void;
  destructive?: boolean;
  /** Not available: `true`, or the reason, which the item shows. */
  disabled?: boolean | string;
}

/**
 * A row's actions in a `…` menu at the row's end (design/app-language.md §5): always rendered, not on
 * hover, so the keyboard reaches it; a 32 px target; destructive items last, after a separator.
 */
export function DataTableRowActions({
  actions,
  label,
}: {
  actions: DataTableRowAction[];
  /** What the row is, for the trigger's name: "Actions for <label>". */
  label: string;
}) {
  if (actions.length === 0) return null;
  const safe = actions.filter((action) => !action.destructive);
  const destructive = actions.filter((action) => action.destructive);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground data-[state=open]:bg-(--table-row-selected)"
          aria-label={`Actions for ${label}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {safe.map((action) => (
          <RowActionItem key={action.label} action={action} />
        ))}
        {safe.length > 0 && destructive.length > 0 && <DropdownMenuSeparator />}
        {destructive.map((action) => (
          <RowActionItem key={action.label} action={action} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RowActionItem({ action }: { action: DataTableRowAction }) {
  const Icon = action.icon;
  const reason =
    typeof action.disabled === "string" ? action.disabled : undefined;
  const content = (
    <>
      {Icon && <Icon className="size-4" />}
      <span className="flex flex-col">
        {action.label}
        {reason && (
          <span className="text-xs text-muted-foreground">{reason}</span>
        )}
      </span>
    </>
  );
  const variant = action.destructive ? "destructive" : "default";

  if (action.href && !action.disabled) {
    return (
      <DropdownMenuItem asChild variant={variant}>
        <Link href={action.href as Route}>{content}</Link>
      </DropdownMenuItem>
    );
  }
  return (
    <DropdownMenuItem
      variant={variant}
      disabled={Boolean(action.disabled)}
      onSelect={action.onSelect}
    >
      {content}
    </DropdownMenuItem>
  );
}
