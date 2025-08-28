import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { DataTable } from "@/components/data-table";
import { StatsCards } from "@/components/stats-cards";

interface StatCard {
  title: string;
  value: string | number;
  icon?: LucideIcon;
}

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
  title?: string;
  description?: string;
  stats: StatCard[];
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
  title,
  description,
  stats,
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
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Data Table */}
      <DataTable
        title={title}
        description={description}
        columns={columns}
        data={data}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        emptyActions={emptyActions}
        emptyIcon={emptyIcon}
        searchPlaceholder={searchPlaceholder}
        actions={tableActions}
      />
    </div>
  );
}
