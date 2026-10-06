"use client";

import { ChevronRight } from "lucide-react";
import { type ReactNode, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableRowAction,
  type DataTableState,
  UNKNOWN,
} from "@/components/ui/data-table";
import {
  describeMonthlyVolume,
  formatCompactVolume,
} from "@/lib/generate-content/monthly-volume";
import { dateFormat } from "@/lib/formatters/date-formatters";
import {
  intentLabel,
  type KeywordMetrics,
} from "@/lib/keywords/keyword-metrics";
import { KeywordCard, KeywordDifficulty } from "./keyword-card";

/** One keyword in the table: measured (a Library item, the analysed keyword) or only suggested. */
export type KeywordRow = {
  /** Stable: the store key, or the keyword itself where nothing else names it. */
  id: string;
  keyword: string;
  /** What the analysis measured; none for a keyword that was only suggested. */
  metrics?: KeywordMetrics;
  /** When it was researched (ISO 8601). */
  researchedAt?: string;
};

/** Keywords that belong together (a semantic cluster): a collapsible group beneath the table. */
export type KeywordGroup = {
  name: string;
  /** Beside the name: the group's main intent, say. */
  detail?: string;
  rows: KeywordRow[];
};

const column = createDataTableColumnHelper<KeywordRow>();

/** The volume for sorting: the number, or nothing (sorted last) when there is none. */
function volumeValue(row: KeywordRow): number | undefined {
  if (!row.metrics) return undefined;
  const display = describeMonthlyVolume(
    row.metrics.volume,
    row.metrics.volumeStatus,
  );
  return display.kind === "volume" ? display.volume : undefined;
}

function VolumeCell({ row }: { row: KeywordRow }) {
  if (!row.metrics) return UNKNOWN;
  const display = describeMonthlyVolume(
    row.metrics.volume,
    row.metrics.volumeStatus,
  );
  return display.kind === "volume" ? (
    formatCompactVolume(display.volume)
  ) : (
    <span title={display.detail}>{UNKNOWN}</span>
  );
}

function keywordColumns({
  measured,
  dated,
  useLabel,
  onUse,
}: {
  measured: boolean;
  dated: boolean;
  useLabel: string;
  onUse?: (row: KeywordRow) => void;
}) {
  return column.columns([
    column.accessor("keyword", {
      header: "Keyword",
      cell: ({ getValue }) => (
        <span className="font-medium text-foreground">{getValue()}</span>
      ),
      sortFn: "text",
      enableHiding: false,
    }),
    ...(measured
      ? [
          column.accessor((row) => volumeValue(row), {
            id: "volume",
            header: "Volume",
            meta: { align: "end", numeric: true },
            cell: ({ row }) => <VolumeCell row={row.original} />,
            sortFn: "basic",
            sortUndefined: "last",
            enableGlobalFilter: false,
          }),
          column.accessor((row) => row.metrics?.difficulty ?? undefined, {
            id: "difficulty",
            header: "Difficulty",
            cell: ({ row }) => (
              <KeywordDifficulty
                score={row.original.metrics?.difficulty ?? null}
                compact
              />
            ),
            sortFn: "basic",
            sortUndefined: "last",
            enableGlobalFilter: false,
          }),
          column.accessor((row) => row.metrics?.intents[0] ?? "", {
            id: "intent",
            header: "Intent",
            cell: ({ row }) => {
              const intent = row.original.metrics?.intents[0];
              return intent ? intentLabel(intent) : UNKNOWN;
            },
            sortFn: "text",
            enableGlobalFilter: false,
          }),
        ]
      : []),
    ...(dated
      ? [
          column.accessor(
            (row) => Date.parse(row.researchedAt ?? "") || undefined,
            {
              id: "researched",
              header: "Researched",
              meta: { align: "end", numeric: true },
              cell: ({ row }) =>
                dateFormat.short(row.original.researchedAt) || UNKNOWN,
              sortFn: "basic",
              sortUndefined: "last",
              enableGlobalFilter: false,
            },
          ),
        ]
      : []),
    ...(onUse
      ? [
          column.display({
            id: "use",
            header: () => <span className="sr-only">Action</span>,
            meta: { align: "end", label: "Action" },
            cell: ({ row }) => (
              <Button
                variant="outline"
                size="sm"
                aria-label={`${useLabel}: ${row.original.keyword}`}
                onClick={() => onUse(row.original)}
              >
                {useLabel}
              </Button>
            ),
          }),
        ]
      : []),
  ]);
}

export interface KeywordTableProps {
  /** The table's name for screen readers. */
  caption: string;
  rows: KeywordRow[];
  /** Collapsible groups beneath the table, in the same columns (the analysis' clusters). */
  groups?: KeywordGroup[];
  /** The row's one action ("Use"): starts the next step with the keyword. */
  onUse?: (row: KeywordRow) => void;
  useLabel?: string;
  rowActions?: (row: KeywordRow) => DataTableRowAction[];
  onRowClick?: (row: KeywordRow) => void;
  /** The search, sort and page from the URL; without it they stay local. */
  state?: DataTableState;
  search?: { placeholder: string };
  isLoading?: boolean;
  error?: ReactNode;
  emptyState?: ReactNode;
}

/**
 * The keyword table (plans/app/E-workflow.md §3 item 3, §4 step 2 and the library): keyword,
 * volume, difficulty and intent where the analysis measured them, when it was researched, and
 * "Use"; the clusters as collapsible groups beneath, in the same columns. On a phone each row is the
 * compact keyword card. The keyword step and the library render this one table.
 */
export function KeywordTable({
  caption,
  rows,
  groups = [],
  onUse,
  useLabel = "Use",
  rowActions,
  onRowClick,
  state,
  search,
  isLoading,
  error,
  emptyState,
}: KeywordTableProps) {
  const all = useMemo(
    () => [...rows, ...groups.flatMap((group) => group.rows)],
    [rows, groups],
  );
  const measured = all.some((row) => row.metrics);
  const dated = all.some((row) => row.researchedAt);
  // The columns stay the same objects while the handler changes from render to render (an inline
  // arrow): the table needs stable columns, and the button calls whichever handler is current.
  const onUseRef = useRef(onUse);
  onUseRef.current = onUse;
  const canUse = Boolean(onUse);
  const columns = useMemo(
    () =>
      keywordColumns({
        measured,
        dated,
        useLabel,
        onUse: canUse ? (row) => onUseRef.current?.(row) : undefined,
      }),
    [measured, dated, useLabel, canUse],
  );

  const renderCard = (row: KeywordRow, { actions }: { actions: ReactNode }) =>
    row.metrics ? (
      <KeywordCard
        size="compact"
        keyword={row.keyword}
        metrics={row.metrics}
        eyebrow={
          row.researchedAt
            ? `Researched ${dateFormat.short(row.researchedAt)}`
            : undefined
        }
        action={
          <div className="flex shrink-0 items-center gap-1">
            {onUse && (
              <Button
                variant="outline"
                size="sm"
                aria-label={`${useLabel}: ${row.keyword}`}
                onClick={() => onUse(row)}
              >
                {useLabel}
              </Button>
            )}
            {actions}
          </div>
        }
      />
    ) : (
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 text-body font-medium text-foreground">
          {row.keyword}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {onUse && (
            <Button
              variant="outline"
              size="sm"
              aria-label={`${useLabel}: ${row.keyword}`}
              onClick={() => onUse(row)}
            >
              {useLabel}
            </Button>
          )}
          {actions}
        </div>
      </div>
    );

  const table = (tableRows: KeywordRow[], tableCaption: string) => (
    <DataTable
      caption={tableCaption}
      columns={columns}
      data={tableRows}
      getRowId={(row) => row.id}
      getRowLabel={(row) => row.keyword}
      rowActions={rowActions}
      onRowClick={onRowClick}
      renderCard={renderCard}
    />
  );

  return (
    <div data-slot="keyword-table" className="flex flex-col gap-6">
      <DataTable
        caption={caption}
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.keyword}
        state={state}
        search={search}
        isLoading={isLoading}
        error={error}
        emptyState={emptyState}
        rowActions={rowActions}
        onRowClick={onRowClick}
        renderCard={renderCard}
      />
      {groups.length > 0 && (
        <section aria-label="Keyword groups" className="flex flex-col gap-2">
          <h3 className="text-label text-muted-foreground">Keyword groups</h3>
          {groups.map((group) => (
            <Collapsible
              key={group.name}
              className="rounded-(--card-radius) border bg-card"
            >
              <CollapsibleTrigger className="group flex w-full items-center gap-2 px-4 py-3 text-left">
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 text-body font-medium text-foreground first-letter:uppercase">
                  {group.name}
                </span>
                <span className="num shrink-0 text-caption text-muted-foreground">
                  {group.rows.length}{" "}
                  {group.rows.length === 1 ? "keyword" : "keywords"}
                  {group.detail ? ` · ${group.detail}` : ""}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                {table(group.rows, `Keyword group: ${group.name}`)}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </section>
      )}
    </div>
  );
}
