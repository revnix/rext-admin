"use client";

import {
  type ColumnFiltersState,
  functionalUpdate,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { type UseQueryStatesKeysMap, useQueryStates } from "nuqs";
import { useMemo, useState } from "react";
import type { DataTableSort } from "./url-state";

/** What a DataTable needs to know and change: the search, the sort, the page and the facets. */
export interface DataTableState {
  globalFilter: string;
  sorting: SortingState;
  pagination: PaginationState;
  columnFilters: ColumnFiltersState;
  onGlobalFilterChange: OnChangeFn<string>;
  onSortingChange: OnChangeFn<SortingState>;
  onPaginationChange: OnChangeFn<PaginationState>;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  /** A search or a facet narrows the list. */
  isFiltered: boolean;
  /** Clears the search and every facet. */
  resetFilters: () => void;
}

/** The keys `dataTableParams` gives every list, read by name. */
interface UrlValues {
  q: string;
  sort: DataTableSort | null;
  page: number;
  size: number;
  [facet: string]: unknown;
}

type UrlPatch = Record<string, unknown>;

const NO_FACETS: readonly never[] = [];

function facetFilters(values: UrlValues, facets: readonly string[]) {
  return facets.flatMap((id) => {
    const value = values[id];
    return Array.isArray(value) && value.length > 0 ? [{ id, value }] : [];
  });
}

/**
 * A list's state in the URL, through the list's own parsers (`lib/search-params/`: `dataTableParams`
 * spread with its facets). Any change but a page turn goes back to the first page. Pass the parsers
 * and the facet keys as module-level constants, so the state keeps its identity between renders.
 */
export function useDataTableUrlState<TParsers extends UseQueryStatesKeysMap>(
  parsers: TParsers,
  {
    facets = NO_FACETS,
  }: { facets?: readonly (keyof TParsers & string)[] } = {},
): DataTableState {
  const [rawValues, rawSetValues] = useQueryStates(parsers);
  // The facets are the list's own keys, typed by its parsers; here they are only read and written by
  // name, so the shared keys are typed and the rest stay unknown.
  const values = rawValues as unknown as UrlValues;
  const setValues = rawSetValues as unknown as (patch: UrlPatch) => unknown;

  const { q, sort, page, size } = values;
  const sorting = useMemo<SortingState>(() => (sort ? [sort] : []), [sort]);
  const pagination = useMemo<PaginationState>(
    () => ({ pageIndex: page, pageSize: size }),
    [page, size],
  );
  const columnFilters = useMemo(
    () => facetFilters(values, facets),
    [values, facets],
  );

  const clearFacets = () =>
    Object.fromEntries(facets.map((id) => [id, null])) as UrlPatch;

  return {
    globalFilter: q,
    sorting,
    pagination,
    columnFilters,
    onGlobalFilterChange: (updater) => {
      const next = functionalUpdate(updater, q);
      setValues({ q: next || null, page: null });
    },
    onSortingChange: (updater) => {
      const [next] = functionalUpdate(updater, sorting);
      setValues({ sort: next ?? null, page: null });
    },
    onPaginationChange: (updater) => {
      const next = functionalUpdate(updater, pagination);
      const sizeChanged = next.pageSize !== size;
      setValues({
        size: next.pageSize,
        page: sizeChanged || next.pageIndex === 0 ? null : next.pageIndex,
      });
    },
    onColumnFiltersChange: (updater) => {
      const next = functionalUpdate(updater, columnFilters);
      const patch: UrlPatch = { ...clearFacets(), page: null };
      for (const { id, value } of next) {
        if (
          (facets as readonly string[]).includes(id) &&
          Array.isArray(value) &&
          value.length > 0
        ) {
          patch[id] = value;
        }
      }
      setValues(patch);
    },
    isFiltered: q !== "" || columnFilters.length > 0,
    resetFilters: () => setValues({ ...clearFacets(), q: null, page: null }),
  };
}

/** The same state kept in the component, for a list whose filters don't belong in the URL. */
export function useDataTableLocalState({
  sorting: initialSorting = [],
  pageSize = 25,
}: {
  sorting?: SortingState;
  pageSize?: number;
} = {}): DataTableState {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const toFirstPage = () =>
    setPagination((current) => ({ ...current, pageIndex: 0 }));

  return {
    globalFilter,
    sorting,
    pagination,
    columnFilters,
    onGlobalFilterChange: (updater) => {
      setGlobalFilter(updater);
      toFirstPage();
    },
    onSortingChange: (updater) => {
      setSorting(updater);
      toFirstPage();
    },
    onPaginationChange: (updater) =>
      setPagination((current) => {
        const next = functionalUpdate(updater, current);
        return next.pageSize === current.pageSize
          ? next
          : { ...next, pageIndex: 0 };
      }),
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      toFirstPage();
    },
    isFiltered: globalFilter !== "" || columnFilters.length > 0,
    resetFilters: () => {
      setGlobalFilter("");
      setColumnFilters([]);
      toFirstPage();
    },
  };
}
