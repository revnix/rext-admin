import { ReactNode } from "react"
import { StatsCards } from "@/components/stats-cards"
import { DataTable } from "@/components/data-table"
import { LucideIcon } from "lucide-react"

interface StatCard {
  title: string
  value: string | number
  icon?: LucideIcon
}

interface Column {
  key: string
  header: string
  width?: string
}

interface EmptyStateAction {
  label: string
  icon?: ReactNode
  variant?: "default" | "outline" | "secondary"
}

interface PlaceholderPageProps {
  title?: string
  description?: string
  stats: StatCard[]
  columns: Column[]
  data?: any[]
  emptyTitle?: string
  emptyDescription?: string
  emptyActions?: EmptyStateAction[]
  searchPlaceholder?: string
  tableActions?: ReactNode
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
  searchPlaceholder,
  tableActions
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
        searchPlaceholder={searchPlaceholder}
        actions={tableActions}
      />
    </div>
  )
}