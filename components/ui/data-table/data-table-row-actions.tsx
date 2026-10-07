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
  DropdownMenuShortcut,
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
  /**
   * The keys that do the same from the row, shown at the item's end ("Alt+↑") and given to assistive
   * technology in `aria-keyshortcuts` form ("Alt+ArrowUp").
   */
  shortcut?: { label: string; keys: string };
}

/**
 * A row's actions in a `…` menu at the row's end (design/app-language.md §5): always rendered, not on
 * hover, so the keyboard reaches it; a 32 px target (40 px under 1024 px, for a finger); destructive
 * items last, after a separator.
 */
export function DataTableRowActions({
  actions,
  label,
  open,
  onOpenChange,
  onCloseAutoFocus,
  triggerTabIndex,
}: {
  actions: DataTableRowAction[];
  /** What the row is, for the trigger's name: "Actions for <label>". */
  label: string;
  /** Controlled, for a row that opens its menu from the keyboard (Shift+F10). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Where focus goes when the menu closes; by default, back to the trigger. */
  onCloseAutoFocus?: (event: Event) => void;
  /** -1 for a row that is itself the keyboard's stop (a tree grid), so the trigger isn't a second one. */
  triggerTabIndex?: number;
}) {
  if (actions.length === 0) return null;
  const safe = actions.filter((action) => !action.destructive);
  const destructive = actions.filter((action) => action.destructive);

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          tabIndex={triggerTabIndex}
          className="size-8 text-muted-foreground data-[state=open]:bg-(--table-row-selected) max-lg:size-10"
          aria-label={`Actions for ${label}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-40"
        onCloseAutoFocus={onCloseAutoFocus}
      >
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
      {action.shortcut && (
        <DropdownMenuShortcut aria-hidden="true" className="tracking-normal">
          {action.shortcut.label}
        </DropdownMenuShortcut>
      )}
    </>
  );
  const variant = action.destructive ? "destructive" : "default";

  if (action.href && !action.disabled) {
    return (
      <DropdownMenuItem
        asChild
        variant={variant}
        aria-keyshortcuts={action.shortcut?.keys}
      >
        <Link href={action.href as Route}>{content}</Link>
      </DropdownMenuItem>
    );
  }
  return (
    <DropdownMenuItem
      variant={variant}
      disabled={Boolean(action.disabled)}
      onSelect={action.onSelect}
      aria-keyshortcuts={action.shortcut?.keys}
    >
      {content}
    </DropdownMenuItem>
  );
}
