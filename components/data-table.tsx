"use client";

import { ChevronLeft, ChevronRight, Filter, Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActionsCell,
  shouldShowActionsOnHover,
} from "@/components/ui/actions-cell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState, SearchEmptyState } from "@/components/ui/empty-state";
import { FilterPopover } from "@/components/ui/filter-popover";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import type { Column, ColumnFilter, RowAction } from "@/types/data-table";

interface EmptyStateAction {
  label: string;
  icon?: ReactNode;
  variant?: "default" | "outline" | "secondary";
  onClick?: () => void;
  href?: string;
}

interface DataTableProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  columns: Column<T>[];
  data?: T[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActions?: EmptyStateAction[];
  emptyIcon?: ReactNode;
  searchPlaceholder?: string;
  showSearch?: boolean;
  actions?: ReactNode;
  onRowClick?: (row: T) => void;
  rowActions?: RowAction<T>[];
  pageSize?: number;
  pageSizeOptions?: number[];
  searchFields?: (keyof T)[];
  isLoading?: boolean;
  tableId?: string; // For localStorage persistence
  /**
   * Higher-contrast header row (white, foreground text). Opt-in while the
   * style is reviewed; becomes the default once approved.
   */
  strongHeader?: boolean;
  // Render each row as a stacked card below `md`. The table's min-content
  // width (cell padding + the actions column) is far wider than a phone
  // viewport, so on mobile the table would only ever show its first column
  // or two with the rest behind a horizontal scroll.
  mobileCards?: boolean;
  searchWidth?: string;
  manualPagination?: boolean;
  page?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearchChange?: (search: string) => void;
}

export function DataTable<
  T extends Record<string, unknown> = Record<string, unknown>,
>({
  columns,
  data = [],
  emptyTitle,
  emptyDescription,
  emptyActions = [],
  emptyIcon,
  searchPlaceholder = "Search...",
  showSearch = true,
  actions,
  onRowClick,
  rowActions = [],
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  searchFields = [],
  isLoading = false,
  tableId,
  strongHeader = false,
  mobileCards = false,
  searchWidth = "md:w-80",
  manualPagination = false,
  page: propPage,
  totalCount: propTotalCount,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
}: DataTableProps<T>) {
  // Helper function to get localStorage key for page size
  const getPageSizeKey = () => `data-table-page-size-${tableId || "default"}`;

  // Get initial page size from localStorage or fallback to prop
  const getInitialPageSize = () => {
    if (typeof window === "undefined") return pageSize;
    try {
      const stored = localStorage.getItem(getPageSizeKey());
      if (stored) {
        const parsedSize = Number(stored);
        // Validate that the stored size is in available options
        if (pageSizeOptions.includes(parsedSize)) {
          return parsedSize;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    return pageSize;
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(getInitialPageSize);
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);

  // Debounce search query to prevent excessive filtering
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Helper function to apply individual column filters
  const applyColumnFilter = useCallback(
    (value: unknown, filter: ColumnFilter): boolean => {
      const { operator, value: filterValue } = filter;

      // Handle empty/not empty operators
      if (operator === "is_empty") {
        return (
          value === null ||
          value === undefined ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        );
      }
      if (operator === "is_not_empty") {
        return (
          value !== null &&
          value !== undefined &&
          value !== "" &&
          (!Array.isArray(value) || value.length > 0)
        );
      }

      // Convert values for comparison
      const strValue = String(value || "").toLowerCase();
      const strFilterValue = String(filterValue || "").toLowerCase();

      // Handle array operations
      if (
        operator === "array_contains" &&
        Array.isArray(value) &&
        Array.isArray(filterValue)
      ) {
        return filterValue.some((fv) =>
          value.some((v) =>
            String(v || "")
              .toLowerCase()
              .includes(String(fv || "").toLowerCase()),
          ),
        );
      }
      if (
        operator === "array_not_contains" &&
        Array.isArray(value) &&
        Array.isArray(filterValue)
      ) {
        return !filterValue.some((fv) =>
          value.some((v) =>
            String(v || "")
              .toLowerCase()
              .includes(String(fv || "").toLowerCase()),
          ),
        );
      }

      // Handle numeric operations
      if (operator.includes("greater_than") || operator.includes("less_than")) {
        const numValue = Number(value);
        const numFilterValue = Number(filterValue);
        if (Number.isNaN(numValue) || Number.isNaN(numFilterValue))
          return false;

        switch (operator) {
          case "greater_than":
            return numValue > numFilterValue;
          case "greater_than_equal":
            return numValue >= numFilterValue;
          case "less_than":
            return numValue < numFilterValue;
          case "less_than_equal":
            return numValue <= numFilterValue;
        }
      }

      // Handle text operations
      switch (operator) {
        case "equals":
          return strValue === strFilterValue;
        case "not_equals":
          return strValue !== strFilterValue;
        case "contains":
          return strValue.includes(strFilterValue);
        case "not_contains":
          return !strValue.includes(strFilterValue);
        case "starts_with":
          return strValue.startsWith(strFilterValue);
        case "ends_with":
          return strValue.endsWith(strFilterValue);
        default:
          return true;
      }
    },
    [],
  );

  // Advanced filtering with both search and column filters
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply column filters first
    if (columnFilters.length > 0) {
      result = result.filter((row) => {
        return columnFilters.every((filter) => {
          const value = row[filter.columnKey];
          return applyColumnFilter(value, filter);
        });
      });
    }

    // Apply global search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter((row) => {
        // If specific search fields are provided, only search those
        if (searchFields.length > 0) {
          return searchFields.some((field) => {
            const value = row[field];

            // Handle objects (like owner: {name: '...'})
            if (value && typeof value === "object" && !Array.isArray(value)) {
              return Object.values(value).some((val) =>
                String(val || "")
                  .toLowerCase()
                  .includes(query),
              );
            }

            // Handle array fields (like tags)
            if (Array.isArray(value)) {
              return value.some((item) =>
                String(item || "")
                  .toLowerCase()
                  .includes(query),
              );
            }

            // Handle regular fields
            return String(value || "")
              .toLowerCase()
              .includes(query);
          });
        }

        // Otherwise search all values in the row
        return Object.values(row).some((value) => {
          // Handle objects
          if (value && typeof value === "object" && !Array.isArray(value)) {
            return Object.values(value).some((val) =>
              String(val || "")
                .toLowerCase()
                .includes(query),
            );
          }

          // Handle array fields
          if (Array.isArray(value)) {
            return value.some((item) =>
              String(item || "")
                .toLowerCase()
                .includes(query),
            );
          }

          // Handle regular fields
          return String(value || "")
            .toLowerCase()
            .includes(query);
        });
      });
    }

    return result;
  }, [
    data,
    debouncedSearchQuery,
    searchFields,
    columnFilters,
    applyColumnFilter,
  ]);

  const activePage = manualPagination ? (propPage ?? currentPage) : currentPage;
  const displayTotalCount = manualPagination
    ? (propTotalCount ?? data.length)
    : filteredData.length;

  // Paginate filtered data
  const paginatedData = useMemo(() => {
    if (manualPagination) return data;
    const startIndex = (currentPage - 1) * currentPageSize;
    return filteredData.slice(startIndex, startIndex + currentPageSize);
  }, [data, filteredData, currentPage, currentPageSize, manualPagination]);

  const totalPages = Math.ceil(displayTotalCount / currentPageSize);
  const hasData = manualPagination
    ? (propTotalCount ?? data.length) > 0 || searchQuery !== ""
    : data.length > 0;
  const hasFilteredData = manualPagination
    ? data.length > 0
    : filteredData.length > 0;

  // Default empty actions if none provided
  const defaultEmptyActions: EmptyStateAction[] = [];
  const displayEmptyActions =
    emptyActions.length > 0 ? emptyActions : defaultEmptyActions;

  const displayRowActions = rowActions.length > 0 ? rowActions : [];

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    onPageChange?.(newPage);
  };

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    onSearchChange?.(value);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: string) => {
    const size = Number(newPageSize);
    setCurrentPageSize(size);
    setCurrentPage(1); // Reset to first page
    onPageSizeChange?.(size);
    onPageChange?.(1);

    // Save to localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(getPageSizeKey(), size.toString());
      } catch {
        // Ignore localStorage errors
      }
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
    onSearchChange?.("");
  };

  // Filter management functions
  const handleApplyFilter = (
    columnKey: string,
    filter: ColumnFilter | null,
  ) => {
    if (filter) {
      // Add or update filter
      const newFilters = columnFilters.filter((f) => f.columnKey !== columnKey);
      newFilters.push(filter);
      setColumnFilters(newFilters);
    } else {
      // Remove filter
      setColumnFilters(columnFilters.filter((f) => f.columnKey !== columnKey));
    }
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleRemoveFilter = (columnKey: string) => {
    setColumnFilters(columnFilters.filter((f) => f.columnKey !== columnKey));
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setColumnFilters([]);
    setCurrentPage(1);
  };

  // Get current filter for a column
  const getColumnFilter = (columnKey: string) => {
    return columnFilters.find((f) => f.columnKey === columnKey);
  };

  // Cell rendering shared by the table body and the mobile cards, so both
  // views always show the same value for a column.
  const renderCell = (column: Column<T>, row: T): ReactNode => {
    const value = (row as Record<string, unknown>)[column.key];
    if (column.cell) return column.cell(value, row);
    return (value as string) || "--";
  };

  const getRowKey = (row: T, index: number) =>
    "id" in row ? (row.id as string) : `row-${index}`;

  // The first column identifies the row (name/title), so it becomes the card
  // headline and the rest become label/value pairs.
  const [primaryColumn, ...detailColumns] = columns;

  // Icon-only buttons rely on hover tooltips, which touch devices don't have.
  const mobileRowActions = displayRowActions.map((action) => ({
    ...action,
    showLabel: true,
  }));

  return (
    <Card className="border-none bg-transparent">
      {(actions || showSearch || columnFilters.length > 0) && (
        <CardHeader className="px-0 pt-0 pb-4">
          {(actions || showSearch) && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {showSearch && (
                <div
                  className={`relative w-full sm:flex-1 min-w-0 sm:max-w-md ${searchWidth}`}
                >
                  <Search className="z-10 pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    className="pl-9 pr-9 w-full"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    disabled={!hasData}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-7 w-7 p-0 rounded-full"
                      onClick={handleClearSearch}
                      disabled={!hasData}
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              )}
              {/* Actions container */}
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:mr-2">
                {actions}
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {columnFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-sm font-medium text-muted-foreground">
                Active filters:
              </span>
              {columnFilters.map((filter) => (
                <Badge
                  key={`${filter.columnKey}-${filter.operator}`}
                  variant="secondary"
                  className="text-xs"
                >
                  {filter.label}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveFilter(filter.columnKey)}
                  />
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllFilters}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardHeader>
      )}

      <CardContent className="p-0">
        {isLoading ? (
          <TableSkeleton rows={currentPageSize} columns={columns.length} />
        ) : hasData ? (
          hasFilteredData ? (
            <>
              <div
                className={`relative w-full overflow-x-auto rounded-md border bg-card ${
                  mobileCards ? "hidden md:block" : ""
                }`}
              >
                <Table>
                  <TableHeader
                    className={
                      strongHeader ? "bg-card [&_tr]:border-border" : undefined
                    }
                  >
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead
                          key={column.key}
                          style={{ width: column.width }}
                          className={
                            strongHeader
                              ? "h-11 text-[13px] font-medium text-foreground"
                              : undefined
                          }
                        >
                          <div className="flex items-center gap-1">
                            <span>{column.header}</span>
                            {column.filterable && (
                              <FilterPopover
                                column={column}
                                data={data}
                                currentFilter={getColumnFilter(column.key)}
                                onApplyFilter={(filter) =>
                                  handleApplyFilter(column.key, filter)
                                }
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-6 w-6 p-0 ${getColumnFilter(column.key) ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                  <Filter className="h-3 w-3" />
                                </Button>
                              </FilterPopover>
                            )}
                          </div>
                        </TableHead>
                      ))}
                      {displayRowActions.length > 0 && (
                        <TableHead
                          className={
                            strongHeader
                              ? "h-11 w-[200px] text-right text-[13px] font-medium text-foreground"
                              : "w-[200px] text-right font-medium"
                          }
                        >
                          Actions
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((row, index) => (
                      <TableRow
                        key={getRowKey(row as T, index)}
                        className={`group ${
                          onRowClick ? "cursor-pointer" : ""
                        }`}
                        onClick={() => onRowClick?.(row)}
                      >
                        {columns.map((column) => (
                          <TableCell key={column.key}>
                            {renderCell(column, row as T)}
                          </TableCell>
                        ))}
                        {displayRowActions.length > 0 && (
                          <TableCell className="w-[200px]">
                            <ActionsCell
                              actions={displayRowActions}
                              row={row as T}
                              showOnHover={shouldShowActionsOnHover()}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card list — same rows, stacked so nothing sits off-screen */}
              {mobileCards && (
                <ul className="flex flex-col gap-3 md:hidden">
                  {paginatedData.map((row, index) => (
                    <li
                      key={getRowKey(row as T, index)}
                      data-testid="data-table-card"
                      className={`rounded-md border bg-card p-4 ${
                        onRowClick ? "cursor-pointer" : ""
                      }`}
                      onClick={() => onRowClick?.(row)}
                      onKeyDown={(e) => {
                        if (
                          onRowClick &&
                          (e.key === "Enter" || e.key === " ")
                        ) {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }}
                    >
                      {primaryColumn && (
                        <div className="min-w-0">
                          {renderCell(primaryColumn, row as T)}
                        </div>
                      )}
                      {detailColumns.length > 0 && (
                        <dl className="mt-3 flex flex-col gap-2">
                          {detailColumns.map((column) => (
                            <div
                              key={column.key}
                              className="flex items-start justify-between gap-3"
                            >
                              <dt className="shrink-0 text-xs text-muted-foreground">
                                {column.header}
                              </dt>
                              {/* Cells truncate to fit narrow table columns; a
                                  card has the room to wrap them in full. */}
                              <dd className="min-w-0 wrap-break-word text-right text-sm **:whitespace-normal">
                                {renderCell(column, row as T)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {displayRowActions.length > 0 && (
                        <div className="mt-3 border-t pt-3">
                          <ActionsCell
                            actions={mobileRowActions}
                            row={row as T}
                            className="flex-wrap justify-start"
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* Pagination */}
              {(totalPages > 1 || pageSizeOptions.length > 1) && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {pageSizeOptions.length > 1 && (
                      <div className="flex items-center gap-2">
                        <span>Rows per page:</span>
                        <Select
                          value={currentPageSize.toString()}
                          onValueChange={handlePageSizeChange}
                        >
                          <SelectTrigger className="h-8 w-16">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {pageSizeOptions.map((option) => (
                              <SelectItem
                                key={option}
                                value={option.toString()}
                              >
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      {Math.min(
                        (activePage - 1) * currentPageSize + 1,
                        displayTotalCount,
                      )}
                      -
                      {Math.min(
                        activePage * currentPageSize,
                        displayTotalCount,
                      )}{" "}
                      of {displayTotalCount}
                    </div>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePageChange(Math.max(1, activePage - 1))
                        }
                        disabled={activePage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-1 mx-2">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (activePage <= 3) {
                              pageNum = i + 1;
                            } else if (activePage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = activePage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  activePage === pageNum ? "default" : "ghost"
                                }
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handlePageChange(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            );
                          },
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePageChange(Math.min(totalPages, activePage + 1))
                        }
                        disabled={activePage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            // No search results
            <div className="rounded-md border bg-card">
              <SearchEmptyState onClear={() => handleSearchChange("")} />
            </div>
          )
        ) : displayEmptyActions.length > 0 ? (
          // Empty State with actions
          <div className="rounded-md border bg-card">
            <EmptyState
              icon={emptyIcon}
              title={emptyTitle || "No data available"}
              description={
                emptyDescription || "Get started by adding your first item."
              }
              action={
                displayEmptyActions[0]
                  ? {
                      label: displayEmptyActions[0].label,
                      href: displayEmptyActions[0].href,
                      onClick: displayEmptyActions[0].onClick,
                      variant: displayEmptyActions[0].variant,
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          // Empty State without actions
          <div className="rounded-md border bg-card">
            <EmptyState
              icon={emptyIcon}
              title={emptyTitle || "No data available"}
              description={
                emptyDescription || "Get started by adding your first item."
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
