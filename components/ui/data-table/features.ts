import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_arrHas,
  filterFn_includesString,
  globalFilteringFeature,
  metaHelper,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
} from "@tanstack/react-table";

/** What a column tells the table about itself, beyond TanStack's own column definition. */
export interface DataTableColumnMeta {
  /** Numbers, money and dates sit at the end of their cell (design/app-language.md §5). */
  align?: "start" | "end";
  /** Tabular figures, so a column of numbers lines up. */
  numeric?: boolean;
  /** The column's name in the view menu, when its header is not a plain string. */
  label?: string;
}

/**
 * The one set of TanStack Table v9 features every list uses (plans/app/C-shell.md §2.4): search and
 * column filters with facets, sorting, pagination, selection and column visibility. Features in v9
 * are registered, not assumed; a row-model slot comes after the feature it belongs to. A list on the
 * server sets the matching `manual*` option, which skips that client stage.
 */
export const dataTableFeatures = tableFeatures({
  columnMeta: metaHelper<DataTableColumnMeta>(),
  columnVisibilityFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: {
    // The search: the text appears in the value.
    includesString: filterFn_includesString,
    // A facet: the value is one of those chosen.
    arrHas: filterFn_arrHas,
  },
  columnFacetingFeature,
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature,
});

export type DataTableFeatures = typeof dataTableFeatures;

/** Columns for a DataTable, typed by its features and the row's shape. Call it at module scope. */
export function createDataTableColumnHelper<TData extends object>() {
  return createColumnHelper<DataTableFeatures, TData>();
}
