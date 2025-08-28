"use client";

import { ChevronLeft, ChevronRight, Edit2, Eye, MoreHorizontal, Search, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface RowAction {
  label: string;
  icon?: ReactNode;
  onClick: (row: Record<string, any>) => void;
  variant?: "default" | "destructive";
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
  onRowClick?: (row: Record<string, any>) => void;
  rowActions?: RowAction[];
  pageSize?: number;
  searchFields?: string[];
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
  onRowClick,
  rowActions = [],
  pageSize = 10,
  searchFields = [],
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter((row) => {
      // If specific search fields are provided, only search those
      if (searchFields.length > 0) {
        return searchFields.some(field => 
          String(row[field] || "").toLowerCase().includes(query)
        );
      }
      
      // Otherwise search all string values in the row
      return Object.values(row).some(value => 
        String(value || "").toLowerCase().includes(query)
      );
    });
  }, [data, searchQuery, searchFields]);

  // Paginate filtered data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const hasData = data.length > 0;
  const hasFilteredData = filteredData.length > 0;

  // Default empty actions if none provided
  const defaultEmptyActions: EmptyStateAction[] = [];
  const displayEmptyActions = emptyActions.length > 0 ? emptyActions : defaultEmptyActions;

  // Default row actions if none provided
  const defaultRowActions: RowAction[] = [
    {
      label: "View",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row) => console.log("View:", row),
    },
    {
      label: "Edit",
      icon: <Edit2 className="h-4 w-4" />,
      onClick: (row) => console.log("Edit:", row),
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row) => console.log("Delete:", row),
      variant: "destructive" as const,
    },
  ];
  const displayRowActions = rowActions.length > 0 ? rowActions : defaultRowActions;

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

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
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
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
          <>
            {hasFilteredData ? (
              <>
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
                    {paginatedData.map((row, index) => (
                      <TableRow 
                        key={(row as any).id || `row-${index}`}
                        className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                        onClick={() => onRowClick?.(row)}
                      >
                        {columns.map((column) => (
                          <TableCell key={column.key}>
                            {(row as any)[column.key] || "--"}
                          </TableCell>
                        ))}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {displayRowActions.map((action, actionIndex) => (
                                <div key={actionIndex}>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      action.onClick(row);
                                    }}
                                    className={action.variant === "destructive" ? "text-destructive" : ""}
                                  >
                                    {action.icon}
                                    {action.label}
                                  </DropdownMenuItem>
                                  {actionIndex === displayRowActions.length - 2 && (
                                    <DropdownMenuSeparator />
                                  )}
                                </div>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} results
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
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
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // No search results
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No results found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your search terms or clear the search to see all items.
                </p>
                <Button variant="outline" onClick={() => handleSearchChange("")}>
                  Clear search
                </Button>
              </div>
            )}
          </>
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
