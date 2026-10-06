"use client";

import {
  type Column,
  type ColumnDef,
  type ColumnVisibilityState,
  FlexRender,
  type Row,
  type RowSelectionState,
  useTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import {
  type MouseEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useShowAfter } from "@/hooks/use-show-after";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "./data-table-pagination";
import {
  type DataTableRowAction,
  DataTableRowActions,
} from "./data-table-row-actions";
import {
  type DataTableFacet,
  DataTableFacetFilter,
  DataTableSearch,
  DataTableToolbar,
  DataTableViewOptions,
} from "./data-table-toolbar";
import { type DataTableFeatures, dataTableFeatures } from "./features";
import { DATA_TABLE_PAGE_SIZES } from "./url-state";
import {
  type DataTableState,
  useDataTableLocalState,
} from "./use-data-table-state";

/** A list's columns, from `createDataTableColumnHelper<T>().columns([...])`, kept at module scope. */
export type DataTableColumns<TData extends object> = ReadonlyArray<
  ColumnDef<DataTableFeatures, TData>
>;

/** Row heights (design/app-language.md §5): 36, 44 or 52 px. */
const ROW_HEIGHT = {
  compact: "h-9",
  default: "h-11",
  comfortable: "h-13",
} as const;

/** An unknown value reads as a dash, never "N/A" or an empty cell (design/app-language.md §5). */
export const UNKNOWN = "—";

/** What a cell shows when its column says nothing else: its value, or the dash. */
const DEFAULT_COLUMN = {
  cell: ({ getValue }: { getValue: () => unknown }) => {
    const value = getValue();
    return value === null || value === undefined || value === ""
      ? UNKNOWN
      : String(value);
  },
};

// Interactive parts of a row keep their own click; the row's click is for the rest of it.
const INTERACTIVE = "a, button, input, label, [role=checkbox], [role=menuitem]";

export interface DataTableProps<TData extends object> {
  columns: DataTableColumns<TData>;
  /** Stable between renders (a query's data, or a memo), like the columns. */
  data: TData[];
  /** The record's own id, never the index, so selection and keys survive sorting and paging. */
  getRowId: (row: TData) => string;
  /** What the row is, in words: it names the row's menu and checkbox for assistive technology. */
  getRowLabel: (row: TData) => string;
  /** The table's name, read by screen readers (a hidden caption) and given to the scrolling region. */
  caption: string;
  /** The search, sort, page and facets, from `useDataTableUrlState`; without it they stay local. */
  state?: DataTableState;
  /**
   * The server pages, sorts and filters: `data` is the current page and `rowCount` the total, and the
   * page reads `state` to build its request.
   */
  manual?: { rowCount: number };
  isLoading?: boolean;
  skeletonRows?: number;
  /** Shown in place of the rows when loading failed. */
  error?: ReactNode;
  /** Shown in place of the table when there are no rows at all and nothing narrows the list. */
  emptyState?: ReactNode;
  density?: keyof typeof ROW_HEIGHT;
  /** `card`: on the raised surface with a hairline around; `plain`: inside a surface of its own. */
  surface?: "card" | "plain";
  /** Keeps the header in view while the rows scroll inside `maxHeight`. */
  stickyHeader?: boolean;
  maxHeight?: string;
  /** Keeps the first column in view while a wide table scrolls sideways. */
  pinFirstColumn?: boolean;
  search?: { placeholder: string };
  facets?: readonly DataTableFacet[];
  /** A menu to hide and show the columns that allow it. */
  viewOptions?: boolean;
  /** Columns hidden at first: still searched, and shown again from the View menu. */
  hiddenColumns?: readonly string[];
  /** At the toolbar's end: the list's own buttons. */
  actions?: ReactNode;
  /** The row's `…` menu. */
  rowActions?: (row: TData) => DataTableRowAction[];
  /** With selection: the buttons for the selected rows. Adds the checkbox column. */
  bulkActions?: (rows: TData[], clearSelection: () => void) => ReactNode;
  /** A click anywhere on the row but its links and buttons, for opening a side sheet. */
  onRowClick?: (row: TData) => void;
  pageSizeOptions?: readonly number[];
  /**
   * Under 640 px the rows become a list of cards drawn by this (design/app-language.md §5); without it
   * the table scrolls sideways. `actions` is the row's `…` menu, for the card to place.
   */
  renderCard?: (row: TData, parts: { actions: ReactNode }) => ReactNode;
}

/**
 * The one table for lists (plans/app/C-shell.md §2.4, research 06 §5.7), on TanStack Table v9: a
 * toolbar with search, facets and the view menu; headers that sort; row menus and selection; a
 * skeleton, an error, an empty state and a no-results state; pagination; cards on a phone.
 */
export function DataTable<TData extends object>({
  columns,
  data,
  getRowId,
  getRowLabel,
  caption,
  state: givenState,
  manual,
  isLoading = false,
  skeletonRows = 5,
  error,
  emptyState,
  density = "default",
  surface = "card",
  stickyHeader = false,
  maxHeight,
  pinFirstColumn = false,
  search,
  facets = [],
  viewOptions = false,
  hiddenColumns,
  actions,
  rowActions,
  bulkActions,
  onRowClick,
  pageSizeOptions = DATA_TABLE_PAGE_SIZES,
  renderCard,
}: DataTableProps<TData>) {
  const localState = useDataTableLocalState();
  const state = givenState ?? localState;
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>(() =>
      Object.fromEntries((hiddenColumns ?? []).map((id) => [id, false])),
    );

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    defaultColumn: DEFAULT_COLUMN,
    getRowId,
    state: {
      globalFilter: state.globalFilter,
      sorting: state.sorting,
      pagination: state.pagination,
      columnFilters: state.columnFilters,
      rowSelection,
      columnVisibility,
    },
    onGlobalFilterChange: state.onGlobalFilterChange,
    onSortingChange: state.onSortingChange,
    onPaginationChange: state.onPaginationChange,
    onColumnFiltersChange: state.onColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: "includesString",
    // One column at a time, ascending and descending: the URL holds a single sort.
    enableMultiSort: false,
    enableSortingRemoval: false,
    // The page is the URL's; a reload must not send it back to the first one. Changes that should
    // go back to it (search, sort, facets, page size) do so in the state hook.
    autoResetPageIndex: false,
    enableRowSelection: Boolean(bulkActions),
    manualPagination: Boolean(manual),
    manualSorting: Boolean(manual),
    manualFiltering: Boolean(manual),
    rowCount: manual?.rowCount,
  });

  const rows = table.getRowModel().rows;
  const pageCount = table.getPageCount();
  const { pageIndex, pageSize } = state.pagination;
  const { onPaginationChange } = state;

  // A page past the end (rows deleted, or a hand-edited URL) shows the last one there is.
  useEffect(() => {
    if (!isLoading && pageCount > 0 && pageIndex >= pageCount) {
      onPaginationChange((current) => ({
        ...current,
        pageIndex: pageCount - 1,
      }));
    }
  }, [isLoading, pageCount, pageIndex, onPaginationChange]);

  const showSkeleton = useShowAfter(isLoading);
  const selected = table.getSelectedRowModel().rows.map((row) => row.original);
  const clearSelection = () => table.resetRowSelection(true);
  const leafColumns = table.getAllLeafColumns();
  const rowHeight = ROW_HEIGHT[density];
  const extraColumns = (bulkActions ? 1 : 0) + (rowActions ? 1 : 0);
  const columnCount = table.getVisibleLeafColumns().length + extraColumns;

  const toolbarStart = (
    <>
      {search && (
        <DataTableSearch
          value={state.globalFilter}
          onChange={(value) => table.setGlobalFilter(value)}
          placeholder={search.placeholder}
        />
      )}
      {facets.map((facet) => {
        const column = table.getColumn(facet.column);
        return column ? (
          <DataTableFacetFilter
            key={facet.column}
            column={column}
            facet={facet}
            onServer={Boolean(manual)}
          />
        ) : null;
      })}
      {state.isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 max-lg:h-10"
          onClick={state.resetFilters}
        >
          Clear filters
        </Button>
      )}
    </>
  );
  const toolbarEnd = (
    <>
      {viewOptions && <DataTableViewOptions columns={leafColumns} />}
      {actions}
    </>
  );
  const hasToolbar =
    Boolean(search) || facets.length > 0 || viewOptions || Boolean(actions);
  const noRowsAtAll =
    !isLoading && !error && data.length === 0 && !state.isFiltered;

  const frame = cn(
    surface === "card" &&
      "overflow-hidden rounded-(--card-radius) border bg-card",
  );

  if (noRowsAtAll && emptyState) {
    // The empty state stands outside the table, with the list's own actions beside it.
    return (
      <div data-slot="data-table" className="flex flex-col gap-3">
        {actions && <DataTableToolbar start={null} end={actions} />}
        <div className={frame}>{emptyState}</div>
      </div>
    );
  }

  let body: ReactNode;
  if (error) {
    body = error;
  } else if (!isLoading && rows.length === 0) {
    body = state.isFiltered ? (
      <div
        className={cn(
          frame,
          "flex flex-col items-center gap-3 px-6 py-12 text-center",
        )}
      >
        <p className="text-section">No results</p>
        <p className="text-sm text-muted-foreground">
          Nothing matches this search or these filters.
        </p>
        <Button variant="outline" size="sm" onClick={state.resetFilters}>
          Clear filters
        </Button>
      </div>
    ) : (
      <p
        className={cn(
          frame,
          "px-6 py-12 text-center text-sm text-muted-foreground",
        )}
      >
        Nothing here yet.
      </p>
    );
  } else {
    body = (
      <>
        <div className={cn(frame, renderCard && "hidden sm:block")}>
          <ScrollingTable
            caption={caption}
            maxHeight={stickyHeader ? maxHeight : undefined}
          >
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id} className="hover:bg-transparent">
                  {bulkActions && (
                    <TableHead
                      className={cn("w-10", stickyHeader && STICKY_HEAD)}
                    >
                      <Checkbox
                        aria-label="Select every row on this page"
                        checked={
                          table.getIsAllPageRowsSelected()
                            ? true
                            : table.getIsSomePageRowsSelected()
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={(checked) =>
                          table.toggleAllPageRowsSelected(checked === true)
                        }
                      />
                    </TableHead>
                  )}
                  {group.headers.map((header, index) => {
                    const sorted = header.column.getIsSorted();
                    const meta = header.column.columnDef.meta;
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        aria-sort={
                          sorted === "asc"
                            ? "ascending"
                            : sorted === "desc"
                              ? "descending"
                              : undefined
                        }
                        className={cn(
                          meta?.align === "end" && "text-right",
                          stickyHeader && STICKY_HEAD,
                          pinFirstColumn && index === 0 && PINNED,
                        )}
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <SortButton
                            column={header.column}
                            alignEnd={meta?.align === "end"}
                          >
                            <FlexRender header={header} />
                          </SortButton>
                        ) : (
                          <FlexRender header={header} />
                        )}
                      </TableHead>
                    );
                  })}
                  {rowActions && (
                    <TableHead
                      className={cn("w-12", stickyHeader && STICKY_HEAD)}
                    >
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  )}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading
                ? showSkeleton &&
                  Array.from({ length: skeletonRows }, (_, index) => (
                    // The skeleton rows have no record behind them; their place is their key.
                    // biome-ignore lint/suspicious/noArrayIndexKey: placeholders in a fixed order
                    <TableRow key={index} className="hover:bg-transparent">
                      {Array.from({ length: columnCount }, (_, cell) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: placeholders in a fixed order
                        <TableCell key={cell} className={rowHeight}>
                          <Skeleton className="h-4 w-full max-w-40" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : rows.map((row) => (
                    <BodyRow
                      key={row.id}
                      row={row}
                      rowHeight={rowHeight}
                      label={getRowLabel(row.original)}
                      selectable={Boolean(bulkActions)}
                      actions={rowActions?.(row.original)}
                      onRowClick={onRowClick}
                      pinFirstColumn={pinFirstColumn}
                    />
                  ))}
            </TableBody>
          </ScrollingTable>
        </div>
        {renderCard && (
          <ul className="flex flex-col gap-2 sm:hidden" aria-label={caption}>
            {isLoading
              ? showSkeleton &&
                Array.from(
                  { length: Math.min(skeletonRows, 3) },
                  (_, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: placeholders in a fixed order
                    <li key={index} className={CARD}>
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="mt-2 h-3 w-1/3" />
                    </li>
                  ),
                )
              : rows.map((row) => (
                  <li key={row.id} className={CARD}>
                    {renderCard(row.original, {
                      actions: rowActions ? (
                        <DataTableRowActions
                          actions={rowActions(row.original)}
                          label={getRowLabel(row.original)}
                        />
                      ) : null,
                    })}
                  </li>
                ))}
          </ul>
        )}
      </>
    );
  }

  return (
    <div data-slot="data-table" className="flex flex-col gap-3">
      {hasToolbar && <DataTableToolbar start={toolbarStart} end={toolbarEnd} />}
      {bulkActions && selected.length > 0 && (
        <section
          aria-label="Selected rows"
          className="flex flex-wrap items-center gap-2 rounded-(--card-radius) border bg-(--table-row-selected) px-3 py-2 text-table"
        >
          <span className="num font-medium">{selected.length} selected</span>
          {bulkActions(selected, clearSelection)}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-8 max-lg:h-10"
            onClick={clearSelection}
          >
            Clear selection
          </Button>
        </section>
      )}
      {body}
      {!error && !isLoading && rows.length > 0 && (
        <DataTablePagination
          pageIndex={pageIndex}
          pageCount={pageCount}
          pageSize={pageSize}
          rowCount={table.getRowCount()}
          selectedCount={selected.length}
          pageSizeOptions={pageSizeOptions}
          onPageIndexChange={(index) => table.setPageIndex(index)}
          onPageSizeChange={(size) => table.setPageSize(size)}
        />
      )}
    </div>
  );
}

const STICKY_HEAD = "sticky top-0 z-(--z-sticky)";
const PINNED =
  "sticky left-0 z-(--z-sticky) bg-card group-hover/row:bg-(--table-row-hover)";
const CARD =
  "rounded-(--card-radius) border bg-card p-3 text-table [&:has(a:focus-visible)]:ring-2 [&:has(a:focus-visible)]:ring-ring";

function BodyRow<TData extends object>({
  row,
  rowHeight,
  label,
  selectable,
  actions,
  onRowClick,
  pinFirstColumn,
}: {
  row: Row<DataTableFeatures, TData>;
  rowHeight: string;
  label: string;
  selectable: boolean;
  actions?: DataTableRowAction[];
  onRowClick?: (row: TData) => void;
  pinFirstColumn: boolean;
}) {
  const isSelected = row.getIsSelected();
  const handleClick = onRowClick
    ? (event: MouseEvent<HTMLTableRowElement>) => {
        if ((event.target as Element).closest(INTERACTIVE)) return;
        onRowClick(row.original);
      }
    : undefined;

  return (
    <TableRow
      data-state={isSelected ? "selected" : undefined}
      className={cn("group/row", onRowClick && "cursor-pointer")}
      onClick={handleClick}
    >
      {selectable && (
        <TableCell className={cn("w-10", rowHeight)}>
          <Checkbox
            aria-label={`Select ${label}`}
            checked={isSelected}
            disabled={!row.getCanSelect()}
            onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          />
        </TableCell>
      )}
      {row.getVisibleCells().map((cell, index) => {
        const meta = cell.column.columnDef.meta;
        return (
          <TableCell
            key={cell.id}
            className={cn(
              rowHeight,
              meta?.align === "end" && "text-right",
              meta?.numeric && "num",
              pinFirstColumn && index === 0 && PINNED,
            )}
          >
            <FlexRender cell={cell} />
          </TableCell>
        );
      })}
      {actions && (
        <TableCell className={cn("w-12 py-0 text-right", rowHeight)}>
          <DataTableRowActions actions={actions} label={label} />
        </TableCell>
      )}
    </TableRow>
  );
}

function SortButton<TData extends object>({
  column,
  alignEnd,
  children,
}: {
  column: Column<DataTableFeatures, TData>;
  alignEnd: boolean;
  children: ReactNode;
}) {
  const sorted = column.getIsSorted();
  const Icon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown;
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        "-mx-1 inline-flex items-center gap-1 rounded-sm px-1 py-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        alignEnd && "flex-row-reverse",
        sorted && "text-foreground",
      )}
    >
      {children}
      <Icon className={cn("size-3.5", !sorted && "opacity-50")} aria-hidden />
    </button>
  );
}

/**
 * The table in its scrolling wrapper. When the table is wider than its frame, the wrapper becomes a
 * labelled region in the tab order, so the keyboard can scroll it (research 06 §5.4).
 */
function ScrollingTable({
  caption,
  maxHeight,
  children,
}: {
  caption: string;
  maxHeight?: string;
  children: ReactNode;
}) {
  const tableRef = useRef<HTMLTableElement>(null);
  const scrolls = useScrolls(tableRef);
  return (
    <Table
      ref={tableRef}
      container={{
        ...(scrolls
          ? { tabIndex: 0, role: "region", "aria-label": caption }
          : {}),
        className: cn(
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          maxHeight && "overflow-y-auto",
        ),
        style: maxHeight ? { maxHeight } : undefined,
      }}
    >
      <TableCaption className="sr-only">{caption}</TableCaption>
      {children}
    </Table>
  );
}

/** Whether the table is wider or taller than the wrapper around it. */
function useScrolls(tableRef: RefObject<HTMLTableElement | null>) {
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const wrapper = tableRef.current?.parentElement;
    if (!wrapper) return;
    const measure = () =>
      setScrolls(
        wrapper.scrollWidth > wrapper.clientWidth ||
          wrapper.scrollHeight > wrapper.clientHeight,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrapper);
    if (tableRef.current) observer.observe(tableRef.current);
    return () => observer.disconnect();
  }, [tableRef]);
  return scrolls;
}
