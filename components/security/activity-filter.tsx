"use client";

import { Calendar, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AuditActions,
  type AuditLogFilters,
  AuditResourceTypes,
} from "@/types/audit-log";

interface ActivityFilterProps {
  filters: AuditLogFilters;
  onFilterChange: (key: keyof AuditLogFilters, value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  resultsCount?: number;
}

export function ActivityFilter({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  resultsCount = 0,
}: ActivityFilterProps) {
  const fromDateRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);

  const openDatePicker = (
    inputRef: React.RefObject<HTMLInputElement | null>,
  ) => {
    const input = inputRef.current;
    if (!input) return;

    input.focus();

    const pickerInput = input as HTMLInputElement & {
      showPicker?: () => void;
    };
    pickerInput.showPicker?.();
  };

  return (
    <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Event Type Filter */}
        <div className="space-y-2">
          <label htmlFor="event-type-filter" className="text-sm font-medium">
            Event Type
          </label>
          <Select
            value={filters.action || "all"}
            onValueChange={(value) =>
              onFilterChange("action", value === "all" ? "" : value)
            }
          >
            <SelectTrigger id="event-type-filter">
              <SelectValue placeholder="All events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              <Separator className="my-1" />

              {/* Authentication Events */}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Authentication
              </div>
              <SelectItem value={AuditActions.AUTH_LOGIN}>Login</SelectItem>
              <SelectItem value={AuditActions.AUTH_LOGOUT}>Logout</SelectItem>
              <SelectItem value={AuditActions.AUTH_PASSWORD_CHANGE}>
                Password Changed
              </SelectItem>
              <SelectItem value={AuditActions.AUTH_PASSWORD_RESET}>
                Password Reset
              </SelectItem>

              <Separator className="my-1" />

              {/* User Events */}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Account
              </div>
              <SelectItem value={AuditActions.USER_CREATE}>
                Account Created
              </SelectItem>
              <SelectItem value={AuditActions.USER_UPDATE}>
                Profile Updated
              </SelectItem>
              <SelectItem value={AuditActions.USER_DEACTIVATE}>
                Account Deactivated
              </SelectItem>

              <Separator className="my-1" />

              {/* Workspace Events */}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Workspace
              </div>
              <SelectItem value={AuditActions.WORKSPACE_CREATE}>
                Workspace Created
              </SelectItem>
              <SelectItem value={AuditActions.WORKSPACE_UPDATE}>
                Workspace Updated
              </SelectItem>
              <SelectItem value={AuditActions.WORKSPACE_DELETE}>
                Workspace Deleted
              </SelectItem>

              <Separator className="my-1" />

              {/* Invitation Events */}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Team
              </div>
              <SelectItem value={AuditActions.INVITATION_CREATE}>
                Invitation Sent
              </SelectItem>
              <SelectItem value={AuditActions.INVITATION_ACCEPT}>
                Invitation Accepted
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label htmlFor="status-filter" className="text-sm font-medium">
            Status
          </label>
          <Select
            value={filters.status || "all"}
            onValueChange={(value) =>
              onFilterChange("status", value === "all" ? "" : value)
            }
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <Separator className="my-1" />
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resource Type Filter */}
        <div className="space-y-2">
          <label htmlFor="resource-filter" className="text-sm font-medium">
            Resource Type
          </label>
          <Select
            value={filters.resource_type || "all"}
            onValueChange={(value) =>
              onFilterChange("resource_type", value === "all" ? "" : value)
            }
          >
            <SelectTrigger id="resource-filter">
              <SelectValue placeholder="All resources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All resources</SelectItem>
              <Separator className="my-1" />
              <SelectItem value={AuditResourceTypes.USER}>User</SelectItem>
              <SelectItem value={AuditResourceTypes.WORKSPACE}>
                Workspace
              </SelectItem>
              <SelectItem value={AuditResourceTypes.INVITATION}>
                Invitation
              </SelectItem>
              <SelectItem value={AuditResourceTypes.SUBSCRIPTION}>
                Subscription
              </SelectItem>
              <SelectItem value={AuditResourceTypes.SESSION}>
                Session
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="date-from" className="text-sm font-medium">
            From Date
          </label>
          <button
            type="button"
            className="relative w-full text-left"
            onClick={() => openDatePicker(fromDateRef)}
            aria-label="Open from date picker"
          >
            <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={fromDateRef}
              id="date-from"
              type="date"
              className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
              value={filters.date_from || ""}
              onChange={(e) => onFilterChange("date_from", e.target.value)}
            />
          </button>
        </div>

        <div className="space-y-2">
          <label htmlFor="date-to" className="text-sm font-medium">
            To Date
          </label>
          <button
            type="button"
            className="relative w-full text-left"
            onClick={() => openDatePicker(toDateRef)}
            aria-label="Open to date picker"
          >
            <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={toDateRef}
              id="date-to"
              type="date"
              className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
              value={filters.date_to || ""}
              onChange={(e) => onFilterChange("date_to", e.target.value)}
            />
          </button>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            {resultsCount} {resultsCount === 1 ? "result" : "results"} found
          </p>
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="mr-1 h-3 w-3" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
