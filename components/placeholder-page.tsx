import type { ReactNode } from "react";
import { DataTable } from "@/components/data-table";

interface Column {
  key: string;
  header: string;
  width?: string;
}

interface EmptyStateAction {
  label: string;
  icon?: ReactNode;
  variant?: "default" | "outline" | "secondary";
}

interface PlaceholderPageProps {
  columns: Column[];
  data?: Record<string, any>[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActions?: EmptyStateAction[];
  emptyIcon?: ReactNode;
  searchPlaceholder?: string;
  tableActions?: ReactNode;
}

export function PlaceholderPage({
  columns,
  data = [],
  emptyTitle,
  emptyDescription,
  emptyActions,
  emptyIcon,
  searchPlaceholder,
  tableActions,
}: PlaceholderPageProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyActions={emptyActions}
      emptyIcon={emptyIcon}
      searchPlaceholder={searchPlaceholder}
      actions={tableActions}
    />
  );
}
