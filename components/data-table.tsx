import { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Search, Filter, MoreHorizontal, Plus } from "lucide-react"

interface Column {
  key: string
  header: string
  width?: string
}

interface EmptyStateAction {
  label: string
  icon?: ReactNode
  variant?: "default" | "outline" | "secondary"
  onClick?: () => void
}

interface DataTableProps {
  title?: string
  description?: string
  columns: Column[]
  data?: any[]
  emptyTitle?: string
  emptyDescription?: string
  emptyActions?: EmptyStateAction[]
  searchPlaceholder?: string
  showSearch?: boolean
  showFilter?: boolean
  actions?: ReactNode
}

export function DataTable({
  title,
  description,
  columns,
  data = [],
  emptyTitle,
  emptyDescription,
  emptyActions = [],
  searchPlaceholder = "Search...",
  showSearch = true,
  showFilter = true,
  actions
}: DataTableProps) {
  const hasData = data.length > 0

  // Default empty actions if none provided
  const defaultEmptyActions: EmptyStateAction[] = [
    { 
      label: "Add New", 
      icon: <Plus className="h-4 w-4" />,
      variant: "default"
    },
    { 
      label: "Import", 
      variant: "outline"
    },
    { 
      label: "Settings", 
      variant: "outline"
    }
  ]

  const displayEmptyActions = emptyActions.length > 0 ? emptyActions : defaultEmptyActions

  return (
    <Card>
      {(title || description || actions || showSearch || showFilter) && (
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
          
          {(showSearch || showFilter) && (
            <div className="flex items-center gap-2">
              {showSearch && (
                <div className="relative max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    className="pl-8"
                    disabled={!hasData}
                  />
                </div>
              )}
              {showFilter && (
                <Button variant="outline" size="sm" disabled={!hasData}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              )}
            </div>
          )}
        </CardHeader>
      )}
      
      <CardContent>
        {hasData ? (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} style={{ width: column.width }}>
                    {column.header}
                  </TableHead>
                ))}
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {row[column.key] || "--"}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <div className="h-8 w-8 rounded bg-muted-foreground/20" />
            </div>
            <h3 className="text-lg font-semibold">
              {emptyTitle || "No data available"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {emptyDescription || "Get started by adding your first item."}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {displayEmptyActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "default"}
                  onClick={action.onClick}
                  disabled
                  className="flex items-center gap-2"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}