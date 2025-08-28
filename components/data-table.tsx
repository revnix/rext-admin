import { MoreHorizontal, Search } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Column {
  key: string;
  header: string;
  width?: string;
}

interface EmptyStateAction {
  label: string;
  icon?: ReactNode;
  variant?: "default" | "outline" | "secondary";
  onClick?: () => void;
  href?: string;
}

interface DataTableProps {
  title?: string;
  description?: string;
  columns: Column[];
  data?: Record<string, any>[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActions?: EmptyStateAction[];
  emptyIcon?: ReactNode;
  searchPlaceholder?: string;
  showSearch?: boolean;
  actions?: ReactNode;
}

export function DataTable({
  title,
  description,
  columns,
  data = [],
  emptyTitle,
  emptyDescription,
  emptyActions = [],
  emptyIcon,
  searchPlaceholder = "Search...",
  showSearch = true,
  actions,
}: DataTableProps) {
  const hasData = data.length > 0;

  // Default empty actions if none provided
  const defaultEmptyActions: EmptyStateAction[] = [];

  const displayEmptyActions =
    emptyActions.length > 0 ? emptyActions : defaultEmptyActions;

  return (
    <Card>
      {(title || description || actions || showSearch) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <div className="flex items-center gap-2">
              {showSearch && (
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    className="pl-8 w-80"
                    disabled={!hasData}
                  />
                </div>
              )}
              {actions}
            </div>
          </div>
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
                <TableRow key={(row as any).id || `row-${index}`}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {(row as any)[column.key] || "--"}
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
              {emptyIcon || <div className="h-8 w-8 rounded bg-muted-foreground/20" />}
            </div>
            <h3 className="text-lg font-semibold">
              {emptyTitle || "No data available"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {emptyDescription || "Get started by adding your first item."}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {displayEmptyActions.map((action) => (
                action.href ? (
                  <Button
                    key={action.label}
                    variant={action.variant || "default"}
                    asChild
                    className="flex items-center gap-2"
                  >
                    <Link href={action.href}>
                      {action.icon}
                      {action.label}
                    </Link>
                  </Button>
                ) : (
                  <Button
                    key={action.label}
                    variant={action.variant || "default"}
                    onClick={action.onClick}
                    className="flex items-center gap-2"
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                )
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
