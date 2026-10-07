import {
  createParser,
  parseAsArrayOf,
  parseAsIndex,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

/**
 * A list's state in the URL, so a reload, a shared link and Back keep it (research 06 §5.5). The
 * parsers are imported from `nuqs/server`, which carries no "use client" directive, so one module
 * serves both the page (`useDataTableUrlState`) and server code (`createLoader`).
 */

/** The page sizes a list offers; lists paginate at 25 by default (design/app-language.md §8). */
export const DATA_TABLE_PAGE_SIZES = [10, 25, 50, 100] as const;

export type DataTablePageSize = (typeof DATA_TABLE_PAGE_SIZES)[number];

/** The one column a list is sorted by, and its direction. */
export interface DataTableSort {
  id: string;
  desc: boolean;
}

/** `?sort=created_at.desc`. */
export const parseAsSort = createParser<DataTableSort>({
  parse(value) {
    const match = /^(\w+)\.(asc|desc)$/.exec(value);
    return match ? { id: match[1], desc: match[2] === "desc" } : null;
  },
  serialize: ({ id, desc }) => `${id}.${desc ? "desc" : "asc"}`,
  eq: (a, b) => a.id === b.id && a.desc === b.desc,
});

/**
 * `?sort=…` for a list whose columns are known: a sort by any other column (a removed one, in an old
 * link) reads as no sort, so the list's default applies instead of no order at all.
 */
export function parseAsSortOf(columns: readonly string[]) {
  return createParser<DataTableSort>({
    parse: (value) => {
      const sort = parseAsSort.parse(value);
      return sort && columns.includes(sort.id) ? sort : null;
    },
    serialize: parseAsSort.serialize,
    eq: parseAsSort.eq,
  });
}

/** A faceted filter, `?status=draft,review`: only the values the list knows survive a hand-edited URL. */
export function parseAsFacet<const T extends string>(values: readonly T[]) {
  return parseAsArrayOf(parseAsStringLiteral(values)).withDefault([]);
}

/**
 * The keys every list has: the search, the sort, the page (1-based in the URL, 0-based here) and the
 * page size. A list spreads these into its own parsers, next to its facets, and may give `sort` a
 * default with `parseAsSort.withDefault(…)`.
 */
export const dataTableParams = {
  q: parseAsString.withDefault(""),
  sort: parseAsSort,
  page: parseAsIndex.withDefault(0),
  size: parseAsNumberLiteral(DATA_TABLE_PAGE_SIZES).withDefault(25),
};
