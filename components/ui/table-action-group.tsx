"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { TableActionGroup as TableActionGroupType } from "@/types/data-table";
import { TableActionButton } from "./table-action-button";
import type { Route } from "next";

interface TableActionGroupProps extends Omit<TableActionGroupType, "id"> {
  className?: string;
  showSeparator?: boolean;
}

export function TableActionGroup({
  label,
  icon,
  actions,
  variant = "outline",
  size = "sm",
  disabled = false,
  className,
  showSeparator = false,
}: TableActionGroupProps) {
  if (actions.length === 0) return null;

  // If only one action, render it directly
  if (actions.length === 1) {
    const action = actions[0];
    return (
      <div className={cn("flex items-center", className)}>
        <TableActionButton
          label={action.label}
          icon={action.icon}
          onClick={action.onClick}
          variant={action.variant || variant}
          size={action.size || size}
          disabled={action.disabled || disabled}
          tooltip={action.tooltip}
          href={action.href as Route}
          shortcut={action.shortcut}
        />
        {showSeparator && <div className="mx-2 h-4 w-px bg-border" />}
      </div>
    );
  }

  // Multiple actions - render as dropdown
  return (
    <div className={cn("flex items-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TableActionButton
            label={label}
            icon={icon || <ChevronDown className="h-4 w-4" />}
            variant={variant}
            size={size}
            disabled={disabled}
            hideLabel={false}
            asChild={false}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {actions.map((action, index) => (
            <div key={action.id}>
              {action.href ? (
                <DropdownMenuItem asChild>
                  <a
                    href={action.href as Route}
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={(e) => {
                      if (action.onClick) {
                        e.preventDefault();
                        action.onClick();
                      }
                    }}
                  >
                    {action.icon && (
                      <span className="h-4 w-4 flex items-center justify-center">
                        {action.icon}
                      </span>
                    )}
                    <span>{action.label}</span>
                    {action.shortcut && (
                      <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-md border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        {action.shortcut}
                      </kbd>
                    )}
                  </a>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {action.icon && (
                    <span className="h-4 w-4 flex items-center justify-center">
                      {action.icon}
                    </span>
                  )}
                  <span>{action.label}</span>
                  {action.shortcut && (
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-md border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      {action.shortcut}
                    </kbd>
                  )}
                </DropdownMenuItem>
              )}
              {/* Add separator between action groups if needed */}
              {index < actions.length - 1 &&
                actions[index + 1].id.includes("separator") && (
                  <DropdownMenuSeparator />
                )}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {showSeparator && <div className="mx-2 h-4 w-px bg-border" />}
    </div>
  );
}

// Helper component for multiple action groups
interface TableActionBarProps {
  groups: TableActionGroupProps[];
  className?: string;
}

export function TableActionBar({ groups, className }: TableActionBarProps) {
  if (groups.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {groups.map((group, index) => (
        <TableActionGroup
          key={group.label}
          {...group}
          showSeparator={index < groups.length - 1}
        />
      ))}
    </div>
  );
}
