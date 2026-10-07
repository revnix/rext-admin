"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { type ReactNode, useId } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Under the table: how many rows there are (and how many are selected), the page size, "Page x of y",
 * and first, previous, next and last. Hidden when everything fits on one page of the smallest size.
 */
export function DataTablePagination({
  pageIndex,
  pageCount,
  pageSize,
  rowCount,
  selectedCount,
  pageSizeOptions,
  onPageIndexChange,
  onPageSizeChange,
}: {
  pageIndex: number;
  pageCount: number;
  pageSize: number;
  rowCount: number;
  selectedCount: number;
  pageSizeOptions: readonly number[];
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const sizeLabel = useId();
  const smallest = Math.min(...pageSizeOptions);
  if (rowCount <= smallest && pageCount <= 1) {
    return selectedCount > 0 ? <Selected count={selectedCount} /> : null;
  }
  const lastPage = Math.max(pageCount - 1, 0);

  return (
    <div
      data-slot="data-table-pagination"
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-table text-muted-foreground"
    >
      {selectedCount > 0 ? (
        <Selected count={selectedCount} />
      ) : (
        <p className="num">
          {rowCount} {rowCount === 1 ? "row" : "rows"}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <span id={sizeLabel}>Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger
              className="h-8 w-20 max-lg:h-10"
              aria-labelledby={sizeLabel}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="num" aria-live="polite">
          Page {pageIndex + 1} of {Math.max(pageCount, 1)}
        </p>
        <div className="flex items-center gap-1">
          <PageButton
            label="First page"
            disabled={pageIndex === 0}
            onClick={() => onPageIndexChange(0)}
          >
            <ChevronsLeft />
          </PageButton>
          <PageButton
            label="Previous page"
            disabled={pageIndex === 0}
            onClick={() => onPageIndexChange(pageIndex - 1)}
          >
            <ChevronLeft />
          </PageButton>
          <PageButton
            label="Next page"
            disabled={pageIndex >= lastPage}
            onClick={() => onPageIndexChange(pageIndex + 1)}
          >
            <ChevronRight />
          </PageButton>
          <PageButton
            label="Last page"
            disabled={pageIndex >= lastPage}
            onClick={() => onPageIndexChange(lastPage)}
          >
            <ChevronsRight />
          </PageButton>
        </div>
      </div>
    </div>
  );
}

function Selected({ count }: { count: number }) {
  return <p className="num">{count} selected</p>;
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="size-8 max-lg:size-10"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
