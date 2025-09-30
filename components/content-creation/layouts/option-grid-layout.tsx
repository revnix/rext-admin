"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface OptionGridLayoutProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Number of columns to display on large screens. Defaults to 3.
   * Uses responsive fallbacks (1 col on mobile, 2 on sm screens, `columns` on lg+).
   */
  columns?: 2 | 3 | 4;
}

const columnClassMap: Record<
  NonNullable<OptionGridLayoutProps["columns"]>,
  string
> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

function OptionGridLayout({
  className,
  columns = 3,
  ...props
}: OptionGridLayoutProps) {
  const resolvedColumns: NonNullable<OptionGridLayoutProps["columns"]> =
    columns;
  return (
    <div
      className={cn(
        "grid gap-3",
        columnClassMap[resolvedColumns] ?? columnClassMap[3],
        className,
      )}
      {...props}
    />
  );
}

export { OptionGridLayout };
export type { OptionGridLayoutProps };
