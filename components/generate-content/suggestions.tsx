"use client";

import { ChevronRight } from "lucide-react";
import { type ReactNode, useId, useMemo } from "react";
import { KeywordCard } from "@/components/keywords/keyword-card";
import {
  type KeywordGroup,
  type KeywordRow,
  KeywordTable,
} from "@/components/keywords/keyword-table";
import {
  SerpSnapshot,
  SerpSnapshotSkeleton,
} from "@/components/keywords/serp-snapshot";
import { SidePaneTrigger, WithSidePane } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useTimedOut } from "@/hooks/use-timed-out";
import {
  intentLabel,
  isSearchIntent,
  keywordMetrics,
  type SearchIntent,
} from "@/lib/keywords/keyword-metrics";
import type { RunFindings } from "@/lib/generate-content/run-findings";
import type { RunStage } from "@/lib/generate-content/run-stages";
import { fillKeywordFacts } from "@/lib/generate-content/step-fill";
import { serpResultsFromGate } from "@/lib/keywords/serp-results";
import { cn } from "@/lib/utils";
import type { KeywordCluster, SEORESULT } from "@/types/generate-content";
import { StageCostTooltip } from "./run-cost";

// No loading state on this step outlives this; then it says what is missing.
const LOADING_TIMEOUT_MS = 30_000;

// What the search results are and why the step shows them, in the customer's words (FB3.2).
const RESULTS_INTRO =
  "The pages Google shows first for this keyword. Your article will compete with them.";

const same = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Step 2, Select keyword (plans/app/E-workflow.md §4 step 2): the analysed keyword on the keyword
 * card, with its intent to write for, and "Continue with this keyword"; the suggestions in the
 * keyword table, with the clusters as groups beneath; the search results' top ten in the side pane
 * when the gate sends them. Analysing another keyword runs the analysis again for it.
 */
export function SuggestionsSection({
  primaryKeyword,
  suggestedKeywords,
  onSelect,
  seoResult,
  selectedIntent,
  onIntentChange,
  keywordClusters = [],
  gate,
}: {
  primaryKeyword: string;
  suggestedKeywords: string[];
  onSelect: (kw: string) => void;
  seoResult: SEORESULT | null;
  selectedIntent: SearchIntent | "";
  onIntentChange: (intent: SearchIntent) => void;
  keywordClusters?: KeywordCluster[];
  /** The keyword gate's payload, for its `serp_titles`. */
  gate?: unknown;
}) {
  // The analysis arrives with the keyword gate; if it never does, stop spinning after 30 s and say
  // so rather than show "Fetching" for ever.
  const analysisTimedOut = useTimedOut(!seoResult, LOADING_TIMEOUT_MS);

  const rows = useMemo<KeywordRow[]>(
    () =>
      suggestedKeywords
        .filter((keyword) => !same(keyword, primaryKeyword))
        .map((keyword) => ({ id: keyword, keyword })),
    [suggestedKeywords, primaryKeyword],
  );

  const groups = useMemo<KeywordGroup[]>(
    () =>
      keywordClusters
        .map((cluster) => ({
          name: cluster.cluster_name,
          detail: isSearchIntent(cluster.main_intent)
            ? intentLabel(cluster.main_intent)
            : undefined,
          rows: cluster.keywords
            .filter((kw) => kw.keyword && !same(kw.keyword, primaryKeyword))
            .map((kw) => ({
              id: `${cluster.cluster_name}:${kw.keyword}`,
              keyword: kw.keyword,
            })),
        }))
        .filter((group) => group.rows.length > 0),
    [keywordClusters, primaryKeyword],
  );

  const serpTitles = useMemo(() => serpResultsFromGate(gate), [gate]);
  // Under 1024 px the search results open from the step's own flow: a floating button covered the
  // Analyze buttons at the end of the list (E29).
  const resultsButton = serpTitles.length > 0 ? <SidePaneTrigger /> : null;

  const step = (
    <div className="flex w-full flex-col gap-6 pt-4 pb-4">
      {seoResult ? (
        <KeywordCard
          keyword={primaryKeyword}
          metrics={keywordMetrics(seoResult)}
          eyebrow="Searched keyword"
          intent={selectedIntent}
          onIntentChange={onIntentChange}
          action={
            <StageCostTooltip stage="title_generation">
              <Button
                data-rec="show"
                size="lg"
                onClick={() => onSelect(primaryKeyword)}
              >
                Continue with this keyword
                <ChevronRight />
              </Button>
            </StageCostTooltip>
          }
        />
      ) : analysisTimedOut ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-body text-muted-foreground">
            The keyword analysis didn't return its data.
          </p>
          {resultsButton}
        </div>
      ) : (
        // The card and the list as they will stand, until the keyword's data is here.
        <>
          <p role="status" className="sr-only">
            Fetching the keyword's data...
          </p>
          <KeywordCard
            keyword={primaryKeyword}
            metrics={keywordMetrics(null)}
            pending={{ metrics: "Loading", intent: "Loading" }}
            eyebrow="Searched keyword"
            action={resultsButton}
          />
          <OtherKeywordsSkeleton />
        </>
      )}

      {seoResult && (
        <section aria-label="Other keywords" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-section text-foreground">Other keywords</h2>
            {resultsButton}
          </div>
          <KeywordTable
            caption="Suggested keywords"
            rows={rows}
            groups={groups}
            onUse={(row) => onSelect(row.keyword)}
            useLabel="Analyze"
            emptyState={
              groups.length === 0 ? (
                <EmptyState
                  title="No suggestions for this keyword"
                  description="Continue with this keyword, or type another one to analyze."
                />
              ) : undefined
            }
          />
        </section>
      )}
    </div>
  );

  if (serpTitles.length === 0) return step;
  return (
    <WithSidePane
      sideTitle="Top search results"
      showTitle
      trigger="inline"
      side={
        <SerpSnapshot
          results={serpTitles}
          heading={null}
          intro={RESULTS_INTRO}
          kinds
        />
      }
    >
      {step}
    </WithSidePane>
  );
}

/**
 * Step 2 while its analysis runs (rext-control#694, the second pass): the step's own layout, filling
 * in. The keyword card shows the keyword at once, the intent once the results are read and the
 * figures once they are measured; the side pane holds the run's stages over the search results,
 * which come first. Nothing here acts: the step takes over, with the suggestions, when the run ends.
 */
export function SuggestionsFilling({
  keyword,
  findings,
  stages,
  progress,
  strip,
}: {
  keyword: string;
  findings: RunFindings;
  stages: RunStage[];
  /** The run's stages, for the side pane (from 1024 px). */
  progress: ReactNode;
  /** The same as one line, above the card (under 1024 px). */
  strip: ReactNode;
}) {
  const reasonId = useId();
  const results = findings.results ?? [];
  const { metrics, pending } = fillKeywordFacts(findings, stages);
  return (
    <WithSidePane
      sideTitle="Top search results"
      trigger="inline"
      side={
        // The same space above as the card beside it: the box would else touch the search field.
        <div className="space-y-6 pt-4">
          {progress}
          {results.length > 0 ? (
            <SerpSnapshot results={results} intro={RESULTS_INTRO} kinds />
          ) : (
            // The list's shape until the results are read, so nothing jumps when they are.
            <SerpSnapshotSkeleton intro={RESULTS_INTRO} />
          )}
        </div>
      }
    >
      <div className="flex w-full flex-col gap-6 pt-4 pb-4">
        {strip}
        <KeywordCard
          keyword={keyword}
          metrics={metrics}
          pending={pending}
          eyebrow="Searched keyword"
          action={
            // The reason beside the button, not under it: the card keeps the height the step's has.
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
              <span
                id={reasonId}
                className="text-caption text-muted-foreground"
              >
                Ready when the analysis ends
              </span>
              <Button
                data-rec="show"
                size="lg"
                disabled
                aria-describedby={reasonId}
              >
                Continue with this keyword
                <ChevronRight />
              </Button>
            </div>
          }
        />
        {results.length > 0 && (
          <div className="flex justify-end">
            <SidePaneTrigger />
          </div>
        )}
        <OtherKeywordsSkeleton />
      </div>
    </WithSidePane>
  );
}

/**
 * "Other keywords" before the suggestions arrive, shaped like their table (FB3.2): the heading, the
 * header row, and rows of a keyword, its monthly searches, its difficulty and the button.
 */
function OtherKeywordsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <section
      data-slot="other-keywords-skeleton"
      aria-label="Other keywords"
      aria-busy="true"
      className="flex flex-col gap-3"
    >
      <h2 className="text-section text-foreground">Other keywords</h2>
      <div
        className="overflow-hidden rounded-(--card-radius) border bg-card"
        aria-hidden
      >
        <div className="flex items-center gap-4 border-b bg-surface-inset px-4 py-2.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="ml-auto hidden h-3 w-16 sm:block" />
          <Skeleton className="hidden h-3 w-16 sm:block" />
          <Skeleton className="h-3 w-12" />
        </div>
        <ul className="divide-y">
          {Array.from({ length: rows }, (_, row) => (
            // The rows are alike and never reordered.
            // biome-ignore lint/suspicious/noArrayIndexKey: see above
            <li key={row} className="flex h-11 items-center gap-4 px-4">
              <Skeleton
                className={cn("h-4", row % 2 === 0 ? "w-48" : "w-36")}
              />
              <Skeleton className="ml-auto hidden h-4 w-12 sm:block" />
              <span className="hidden items-center gap-1.5 sm:flex">
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="h-4 w-10" />
              </span>
              <Skeleton className="h-8 w-20" />
            </li>
          ))}
        </ul>
      </div>
      <span className="sr-only" role="status">
        Finding other keywords
      </span>
    </section>
  );
}
