"use client";

import type { ReactNode } from "react";

interface ListPageProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
}

/**
 * Standard layout for list/table pages
 *
 * @example
 * ```tsx
 * <ListPage
 *   title="Content"
 *   description="Manage your content library"
 *   actions={
 *     <Button href="/content/new">
 *       <Plus className="mr-2 h-4 w-4" />
 *       Create Content
 *     </Button>
 *   }
 *   filters={
 *     <>
 *       <SearchInput />
 *       <FilterSelect />
 *     </>
 *   }
 * >
 *   <DataTable data={content} columns={columns} />
 * </ListPage>
 * ```
 */
export function ListPage({
  title,
  description,
  actions,
  filters,
  children,
}: ListPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>

      {/* Filters */}
      {filters && <div className="flex gap-4">{filters}</div>}

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
