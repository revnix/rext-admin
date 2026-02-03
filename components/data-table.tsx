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

  // Paginate filtered data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * currentPageSize;
    return filteredData.slice(startIndex, startIndex + currentPageSize);
  }, [filteredData, currentPage, currentPageSize]);

  const totalPages = Math.ceil(filteredData.length / currentPageSize);
  const hasData = data.length > 0;
  const hasFilteredData = filteredData.length > 0;

  // Default empty actions if none provided
  const defaultEmptyActions: EmptyStateAction[] = [];
  const displayEmptyActions =
    emptyActions.length > 0 ? emptyActions : defaultEmptyActions;

  const displayRowActions = rowActions.length > 0 ? rowActions : [];

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: string) => {
    const size = Number(newPageSize);
    setCurrentPageSize(size);
    setCurrentPage(1); // Reset to first page

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

  return (
    <Card className="border-none shadow-none bg-transparent">
      {(actions || showSearch || columnFilters.length > 0) && (
        <CardHeader className="px-0 pt-0 pb-6">
          {(actions || showSearch) && (
            <div className="flex flex-wrap items-center gap-2">
              {showSearch && (
                <div className="relative flex-1 min-w-0 md:flex-none md:w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder={searchPlaceholder}
                    className="pl-9 pr-9 w-full bg-white border-slate-200 focus-visible:ring-slate-400"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    disabled={!hasData}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-7 w-7 p-0 hover:bg-slate-100 rounded-full"
                      onClick={handleClearSearch}
                      disabled={!hasData}
                    >
                      <X className="h-3 w-3 text-slate-400" />
                    </Button>
                  )}
                </div>
              )}
              {/* Actions container: 'contents' on mobile unwraps children so they participate in the parent flex grid */}
              <div className="contents md:flex md:items-center md:gap-2 md:ml-auto">{actions}</div>
            </div>
          )}

          {/* Active Filters Display */}
          {columnFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-sm font-medium text-slate-500">
                Active filters:
              </span>
              {columnFilters.map((filter) => (
                <Badge
                  key={`${filter.columnKey}-${filter.operator}`}
                  variant="secondary"
                  className="text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  {filter.label}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer text-slate-400 hover:text-red-500"
                    onClick={() => handleRemoveFilter(filter.columnKey)}
                  />
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllFilters}
                className="h-6 px-2 text-xs text-slate-500 hover:text-slate-800"
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
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead
                        key={column.key}
                        style={{ width: column.width }}
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
                                className={`h-6 w-6 p-0 ${getColumnFilter(column.key) ? "text-primary" : "text-slate-400 hover:text-slate-600"}`}
                              >
                                <Filter className="h-3 w-3" />
                              </Button>
                            </FilterPopover>
                          )}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((row, index) => (
                    <TableRow
                      key={"id" in row ? (row.id as string) : `row-${index}`}
                      className={`group ${
                        onRowClick ? "cursor-pointer hover:bg-slate-50/60" : ""
                      }`}
                      onClick={() => onRowClick?.(row)}
                    >
                      {columns.map((column) => (
                        <TableCell key={column.key}>
                          {column.cell
                            ? column.cell(
                                (row as Record<string, unknown>)[column.key],
                                row as T,
                              )
                            : ((row as Record<string, unknown>)[
                                column.key
                              ] as string) || "--"}
                        </TableCell>
                      ))}
                      <TableCell className="w-[200px]">
                        <ActionsCell
                          actions={displayRowActions}
                          row={row as T}
                          showOnHover={shouldShowActionsOnHover()}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {(totalPages > 1 || pageSizeOptions.length > 1) && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    {pageSizeOptions.length > 1 && (
                      <div className="flex items-center gap-2">
                        <span>Rows per page:</span>
                        <Select
                          value={currentPageSize.toString()}
                          onValueChange={handlePageSizeChange}
                        >
                          <SelectTrigger className="h-8 w-16 border-slate-200">
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
                        (currentPage - 1) * currentPageSize + 1,
                        filteredData.length,
                      )}
                      -
                      {Math.min(
                        currentPage * currentPageSize,
                        filteredData.length,
                      )}{" "}
                      of {filteredData.length}
                    </div>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0 border-slate-200"
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
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  currentPage === pageNum ? "default" : "ghost"
                                }
                                size="sm"
                                className={`h-8 w-8 p-0 ${currentPage !== pageNum ? "text-slate-500 hover:bg-slate-100" : ""}`}
                                onClick={() => setCurrentPage(pageNum)}
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
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0 border-slate-200"
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
            <SearchEmptyState onClear={() => handleSearchChange("")} />
          )
        ) : displayEmptyActions.length > 0 ? (
          // Empty State with actions
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
        ) : (
          // Empty State without actions
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle || "No data available"}
            description={
              emptyDescription || "Get started by adding your first item."
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
