"use client";

import type { Column } from "@tanstack/react-table";
import { ChevronDown, Search, Settings2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import type { DataTableFeatures } from "./features";

/** A faceted filter: a column's values to pick from, each with how many rows hold it. */
export interface DataTableFacet {
  /** The column's id, which is also its key in the URL. */
  column: string;
  title: string;
  /**
   * The values the filter accepts, in this order, with their labels; give it whenever the URL holds
   * the filter, so the menu offers only what a reload keeps. Of these, it shows the ones some row
   * holds and the ones chosen. Without it the values come from the rows themselves.
   */
  options?: readonly { value: string; label: string }[];
}

export function DataTableSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <InputGroup className="h-9 w-full sm:max-w-xs">
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </InputGroup>
  );
}

export function DataTableFacetFilter<TData extends object>({
  column,
  facet,
}: {
  column: Column<DataTableFeatures, TData>;
  facet: DataTableFacet;
}) {
  const counts = column.getFacetedUniqueValues();
  const selected = new Set(
    Array.isArray(column.getFilterValue())
      ? (column.getFilterValue() as string[])
      : [],
  );
  // The values some row holds, and any chosen one no row holds now, so it can still be unticked.
  const options = facet.options
    ? facet.options.filter(
        (option) => counts.has(option.value) || selected.has(option.value),
      )
    : [...new Set([...counts.keys(), ...selected])]
        .filter((value): value is string => typeof value === "string")
        .sort()
        .map((value) => ({ value, label: value }));

  const toggle = (value: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(value);
    else next.delete(value);
    column.setFilterValue(next.size > 0 ? [...next] : undefined);
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          {facet.title}
          {selected.size > 0 && (
            <span className="num rounded-sm bg-(--table-row-selected) px-1.5 text-xs">
              {selected.size}
            </span>
          )}
          <ChevronDown className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {facet.title}
        </DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.has(option.value)}
            onCheckedChange={(checked) =>
              toggle(option.value, checked === true)
            }
            onSelect={(event) => event.preventDefault()}
          >
            <span className="flex-1">{option.label}</span>
            <span className="num text-xs text-muted-foreground">
              {counts.get(option.value) ?? 0}
            </span>
          </DropdownMenuCheckboxItem>
        ))}
        {selected.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => column.setFilterValue(undefined)}>
              Clear {facet.title.toLowerCase()}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The column's name in the view menu: its `meta.label`, else its header when that is a string. */
export function columnLabel<TData extends object>(
  column: Column<DataTableFeatures, TData>,
): string {
  const header = column.columnDef.header;
  return (
    column.columnDef.meta?.label ??
    (typeof header === "string" ? header : column.id)
  );
}

export function DataTableViewOptions<TData extends object>({
  columns,
}: {
  columns: Column<DataTableFeatures, TData>[];
}) {
  const hideable = columns.filter((column) => column.getCanHide());
  if (hideable.length === 0) return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <Settings2 />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Columns
        </DropdownMenuLabel>
        {hideable.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={(checked) =>
              column.toggleVisibility(checked === true)
            }
            onSelect={(event) => event.preventDefault()}
          >
            {columnLabel(column)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The row above the table: the search and the filters first, the view menu and the actions last. */
export function DataTableToolbar({
  start,
  end,
}: {
  start: ReactNode;
  end: ReactNode;
}) {
  return (
    <div
      data-slot="data-table-toolbar"
      className="flex flex-wrap items-center gap-2"
    >
      {start}
      <div className="ml-auto flex items-center gap-2">{end}</div>
    </div>
  );
}
