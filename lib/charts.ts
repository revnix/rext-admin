import type { TooltipItemSorter } from "recharts";

/**
 * Keeps a tooltip's rows in the order the chart declares its series, the order
 * the bars, the lines and the legend show. recharts 3 sorts tooltip rows by
 * name unless told otherwise; its sort is stable, so one key for every row
 * keeps them as declared. Legends take `itemSorter={null}` for the same.
 */
export const inSeriesOrder: TooltipItemSorter = () => 0;
