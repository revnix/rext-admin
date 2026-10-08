"use client";

import {
  ArrowRight,
  Check,
  Loader2,
  Minus,
  Pencil,
  RefreshCcw,
} from "lucide-react";
import { type ReactNode, useEffect, useId, useMemo, useState } from "react";

import {
  KeyphraseText,
  SerpSnapshot,
} from "@/components/keywords/serp-snapshot";
import { WithSidePane } from "@/components/layouts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Meter } from "@/components/ui/meter";
import {
  comparePick,
  measureTitle,
  type SerpTitleFacts,
  serpTitleFacts,
} from "@/lib/generate-content/serp-title-facts";
import type { RunTitleRow } from "@/lib/generate-content/run-stages";
import { titlePlace } from "@/lib/generate-content/step-fill";
import {
  normalizeTitle,
  scoreTitle,
  type TitleScore,
} from "@/lib/generate-content/title-score";
import {
  type SerpResult,
  serpResultsFromGate,
} from "@/lib/keywords/serp-results";
import { cn } from "@/lib/utils";
import { StageCostTooltip } from "./run-cost";

interface TitleStepProps {
  instruction: string;
  /** The gate's five candidates. */
  titles: string[];
  recommendedTitle?: string | null;
  /**
   * The title gate's interrupt payload (rext-backend `topic_generation.py`): its
   * `recommendation_reason`, `focus_keyphrase` and `serp_titles` are read here.
   */
  gate?: unknown;
  /** The run's keyword, intent and content type, said once above the list. */
  context?: (string | null | undefined)[];
  /** The chosen title, as edited; the backend uses it verbatim from here on. */
  onContinue: (title: string) => void;
  onRegenerate: (feedback: string) => void;
  isRegenerating?: boolean;
}

/** The panel's name, and the heading the link above the titles jumps to under 1024 px. */
const PANE_TITLE = "How the top ten title it";
const PANE_HEADING_ID = "top-ten-titles";

/**
 * Step 4, Title (plans/app/E-workflow.md §4): the five candidates as a list, each with a small score
 * (lib/generate-content/title-score.ts), any of them editable before Continue, and beside them how
 * the search results' top ten title their pages (task 695, option A): what their titles have in
 * common, the pick against them, and the ten. Under 1024 px the panel is part of the page instead of
 * a sheet: the facts come before the titles and the rest follows Continue.
 */
export function TitleStep({
  instruction,
  titles,
  recommendedTitle,
  gate,
  context = [],
  onContinue,
  onRegenerate,
  isRegenerating = false,
}: TitleStepProps) {
  const { recommendationReason, focusKeyphrase, serpTitles } = useMemo(
    () => readGate(gate),
    [gate],
  );
  const group = useId();
  const [drafts, setDrafts] = useState<string[]>(titles);
  const [selected, setSelected] = useState(0);
  const [editing, setEditing] = useState<{
    index: number;
    before: string;
  } | null>(null);
  const [feedback, setFeedback] = useState("");

  // A new set of candidates (the first, or a regeneration) replaces the drafts, and the
  // recommended one starts selected.
  const titlesKey = titles.join("\n");
  // biome-ignore lint/correctness/useExhaustiveDependencies: titlesKey stands for titles' content
  useEffect(() => {
    setDrafts(titles);
    setEditing(null);
    const recommended = recommendedTitle
      ? titles.indexOf(recommendedTitle)
      : -1;
    setSelected(Math.max(recommended, 0));
  }, [titlesKey, recommendedTitle]);

  const chosen = normalizeTitle(drafts[selected] ?? "");
  const contextLine = context.filter(Boolean).join(" · ");
  const facts = useMemo(
    () => serpTitleFacts(serpTitles, focusKeyphrase),
    [serpTitles, focusKeyphrase],
  );
  // The ten results, for the panel's two places; they change only with the gate.
  const topTen = useMemo(
    () => (
      <SerpSnapshot
        results={serpTitles}
        heading={null}
        keyphrase={focusKeyphrase}
        measure={(title) => measureTitle(title, focusKeyphrase)}
        marks
      />
    ),
    [serpTitles, focusKeyphrase],
  );

  const regenerate = () => {
    if (isRegenerating) return;
    onRegenerate(feedback);
    setFeedback("");
  };

  const edit = (index: number, value: string) =>
    setDrafts((current) =>
      current.map((draft, i) => (i === index ? value : draft)),
    );

  const list = (
    <div className="w-full py-3">
      <div className="mb-6 space-y-2">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight text-foreground">
          {instruction}
        </h2>
        <p className="text-sm text-muted-foreground">
          Pick a title and edit it if you like: the outline and the article use
          it word for word.
        </p>
        {contextLine && (
          <p className="text-caption text-muted-foreground">{contextLine}</p>
        )}
      </div>

      {facts && (
        <div className="mb-6 space-y-2 lg:hidden">
          <p className="text-table">
            <a href={`#${PANE_HEADING_ID}`} className="link">
              {PANE_TITLE}
            </a>
          </p>
          <TopTenFacts facts={facts} keyphrase={focusKeyphrase} />
        </div>
      )}

      <fieldset
        disabled={isRegenerating}
        className={cn("mb-6", isRegenerating && "opacity-40")}
      >
        <legend data-rec="show" className="sr-only">
          Titles
        </legend>
        <ul className="space-y-2">
          {drafts.map((draft, index) => {
            const id = `${group}-${index}`;
            const isSelected = selected === index;
            const isRecommended =
              recommendedTitle != null && titles[index] === recommendedTitle;
            const isEditing = editing?.index === index;
            return (
              <li
                // The candidates arrive as a set and are edited in place, so the position is the identity.
                // biome-ignore lint/suspicious/noArrayIndexKey: see above
                key={index}
                className={cn(
                  "flex items-start gap-3 rounded-md border p-4 transition-colors",
                  isSelected
                    ? "border-primary bg-surface-inset"
                    : "border-border bg-card hover:bg-surface-inset",
                )}
              >
                <input
                  type="radio"
                  id={id}
                  name={group}
                  checked={isSelected}
                  onChange={() => setSelected(index)}
                  className="mt-1 size-4 shrink-0 cursor-pointer accent-primary"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  {isEditing ? (
                    <Input
                      autoFocus
                      aria-label={`Title ${index + 1}`}
                      value={draft}
                      onChange={(event) => edit(index, event.target.value)}
                      onBlur={() => setEditing(null)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") setEditing(null);
                        if (event.key === "Escape") {
                          edit(index, editing?.before ?? draft);
                          setEditing(null);
                        }
                      }}
                    />
                  ) : (
                    <label
                      htmlFor={id}
                      className={cn(
                        "block cursor-pointer text-base text-foreground",
                        isSelected && "font-medium",
                      )}
                    >
                      <KeyphraseText text={draft} keyphrase={focusKeyphrase} />
                    </label>
                  )}
                  <ScoreLine score={scoreTitle(draft, focusKeyphrase)} />
                  {isRecommended && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">Recommended</Badge>
                      {recommendationReason && (
                        <span className="text-caption text-muted-foreground">
                          {recommendationReason}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Edit title ${index + 1}`}
                    onClick={() => {
                      setSelected(index);
                      setEditing({ index, before: draft });
                    }}
                  >
                    <Pencil />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div className="w-full max-w-3xl rounded-md border border-border bg-card p-1.5">
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          <Button
            data-rec="show"
            variant="outline"
            onClick={regenerate}
            disabled={isRegenerating}
            className="w-full sm:w-auto"
          >
            {isRegenerating ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RefreshCcw />
            )}
            {isRegenerating ? "Regenerating..." : "Regenerate"}
          </Button>
          <Input
            type="text"
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="Or describe what you're looking for..."
            aria-label="What you're looking for"
            onKeyDown={(event) => {
              if (event.key === "Enter" && feedback.trim()) regenerate();
            }}
          />
          <Button
            data-rec="show"
            variant="outline"
            onClick={regenerate}
            disabled={isRegenerating || !feedback.trim()}
            aria-label="Regenerate with this direction"
            className="w-full sm:w-auto"
          >
            <ArrowRight />
          </Button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
        <StageCostTooltip stage="generate_outline">
          <Button
            data-rec="show"
            onClick={() => chosen && onContinue(chosen)}
            disabled={!chosen || isRegenerating}
            className="min-w-[140px]"
          >
            Continue
            <ArrowRight />
          </Button>
        </StageCostTooltip>
      </div>

      {/* Under 1024 px the rest of the panel follows Continue, in the page's flow. */}
      {facts && (
        <section
          aria-labelledby={PANE_HEADING_ID}
          className="mt-8 border-t border-border pt-6 lg:hidden"
        >
          <TopTenPanel
            headingId={PANE_HEADING_ID}
            facts={facts}
            keyphrase={focusKeyphrase}
            pick={chosen}
          >
            {topTen}
          </TopTenPanel>
        </section>
      )}
    </div>
  );

  if (!facts) return list;
  return (
    // From 1024 px the panel is beside the titles. Under it the step shows the panel itself (the
    // facts above the titles, the rest after Continue), so the pane's sheet gets no button here.
    <WithSidePane
      sideTitle={PANE_TITLE}
      trigger="inline"
      side={
        <TopTenPanel
          facts={facts}
          showFacts
          keyphrase={focusKeyphrase}
          pick={chosen}
        >
          {topTen}
        </TopTenPanel>
      }
    >
      {list}
    </WithSidePane>
  );
}

/**
 * Step 4 while its titles are written (rext-control#694, the second pass): the step's own layout,
 * filling in. Each title takes its row when the model has written it, with its score; the one being
 * written and the ones to come hold their places. The side pane holds the run's stages over the top
 * ten, which the run already has. Nothing here acts: the step takes over with the checked set.
 */
export function TitleStepFilling({
  instruction = "Select a title",
  context = [],
  rows,
  keyphrase,
  results,
  progress,
  strip,
}: {
  instruction?: string;
  /** The run's keyword, intent and content type, said once above the list. */
  context?: (string | null | undefined)[];
  /** The titles as the run has them (run-findings.ts' rows). */
  rows: RunTitleRow[];
  /** The keyword the titles are written for: the gate's focus keyphrase isn't here yet. */
  keyphrase: string | null;
  /** The search results the analysis read, for the top ten. */
  results: readonly SerpResult[];
  /** The run's stages, for the side pane (from 1024 px). */
  progress: ReactNode;
  /** The same as one line, above the titles (under 1024 px). */
  strip: ReactNode;
}) {
  const reasonId = useId();
  const contextLine = context.filter(Boolean).join(" · ");
  const facts = useMemo(
    () => serpTitleFacts(results, keyphrase),
    [results, keyphrase],
  );
  const topTen = (
    <SerpSnapshot
      results={results}
      heading={null}
      keyphrase={keyphrase}
      measure={(title) => measureTitle(title, keyphrase)}
      marks
    />
  );

  const list = (
    <div className="w-full py-3">
      <div className="mb-6 space-y-2">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight text-foreground">
          {instruction}
        </h2>
        <p className="text-sm text-muted-foreground">
          Pick a title and edit it if you like: the outline and the article use
          it word for word.
        </p>
        {contextLine && (
          <p className="text-caption text-muted-foreground">{contextLine}</p>
        )}
      </div>

      {strip && <div className="mb-6">{strip}</div>}

      {facts && (
        <div className="mb-6 space-y-2 lg:hidden">
          <p className="text-table">
            <a href={`#${PANE_HEADING_ID}`} className="link">
              {PANE_TITLE}
            </a>
          </p>
          <TopTenFacts facts={facts} keyphrase={keyphrase} />
        </div>
      )}

      <ul aria-label="Titles, being written" className="mb-6 space-y-2">
        {rows.map((row, index) => (
          <li
            // The rows fill in order and never move, so the position is the identity.
            // biome-ignore lint/suspicious/noArrayIndexKey: see above
            key={index}
            className="flex items-start gap-3 rounded-md border border-border bg-card p-4"
          >
            {/* Where the step's radio will be. */}
            <span
              aria-hidden="true"
              className={cn(
                "mt-1 size-4 shrink-0 rounded-full border border-border",
                row.state !== "written" && "border-dashed",
              )}
            />
            <div className="min-w-0 flex-1 space-y-2">
              <p
                className={cn(
                  "text-base",
                  row.state === "next"
                    ? "text-muted-foreground"
                    : "text-foreground",
                )}
              >
                {row.state === "written" ? (
                  <KeyphraseText text={row.title} keyphrase={keyphrase} />
                ) : (
                  // A title just begun has no words yet: its place stands in.
                  row.title.trim() || titlePlace(index)
                )}
                {row.state === "writing" && row.title.trim() && (
                  <span className="text-muted-foreground" aria-hidden="true">
                    …
                  </span>
                )}
              </p>
              {row.state === "written" ? (
                <ScoreLine score={scoreTitle(row.title, keyphrase)} />
              ) : (
                <p className="text-caption text-muted-foreground">
                  {row.state === "writing" ? "Being written" : "Next"}
                </p>
              )}
              {row.recommended && (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">Recommended</Badge>
                  {row.reason && (
                    <span className="text-caption text-muted-foreground">
                      {row.reason}
                    </span>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
        <p id={reasonId} className="text-caption text-muted-foreground">
          You can pick one once all are written and checked.
        </p>
        <Button
          data-rec="show"
          variant="outline"
          disabled
          aria-describedby={reasonId}
        >
          <RefreshCcw />
          Regenerate
        </Button>
        <Button data-rec="show" disabled aria-describedby={reasonId}>
          Continue
          <ArrowRight />
        </Button>
      </div>

      {facts && (
        <section
          aria-labelledby={PANE_HEADING_ID}
          className="mt-8 border-t border-border pt-6 lg:hidden"
        >
          <TopTenPanel
            headingId={PANE_HEADING_ID}
            facts={facts}
            keyphrase={keyphrase}
            pick=""
          >
            {topTen}
          </TopTenPanel>
        </section>
      )}
    </div>
  );

  return (
    <WithSidePane
      sideTitle={PANE_TITLE}
      trigger="inline"
      side={
        // The same space above as the heading beside it.
        <div className="space-y-6 pt-3">
          {progress}
          {facts && (
            <TopTenPanel facts={facts} showFacts keyphrase={keyphrase} pick="">
              {topTen}
            </TopTenPanel>
          )}
        </div>
      }
    >
      {list}
    </WithSidePane>
  );
}

/**
 * The panel: what it is for, the facts, the pick against them, and the ten results (its children).
 * The step renders it twice, each hidden at the other's widths: beside the titles from 1024 px, and
 * after Continue under it, there without the facts, which sit above the titles.
 */
function TopTenPanel({
  headingId,
  facts,
  showFacts = false,
  keyphrase,
  pick,
  children,
}: {
  headingId?: string;
  facts: SerpTitleFacts;
  showFacts?: boolean;
  keyphrase: string | null;
  /** The selected title, as it will be sent. */
  pick: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-1">
        <h2 id={headingId} className="scroll-mt-6 text-section text-foreground">
          {PANE_TITLE}
        </h2>
        <p className="text-table text-muted-foreground">
          Your title will sit among these on the first page of results. Their
          wording, length and keyword placement show what searchers already
          click, so you can match it or stand out.
        </p>
      </div>
      {showFacts && <TopTenFacts facts={facts} keyphrase={keyphrase} />}
      {pick && <YourPick title={pick} facts={facts} keyphrase={keyphrase} />}
      {children}
      <p className="text-caption text-muted-foreground">
        From the search this run analysed.
        {keyphrase && " The keyword is in bold."}
      </p>
    </div>
  );
}

/** "1 runs", "4 run", "none run": a count as the subject of a verb. */
function counted(count: number, verb: string) {
  if (count === 0) return `none ${verb}`;
  return (
    <>
      <span className="num">{count}</span> {count === 1 ? `${verb}s` : verb}
    </>
  );
}

/** The three facts: the keyphrase's use and lead, the typical length, and the shared words. */
function TopTenFacts({
  facts,
  keyphrase,
}: {
  facts: SerpTitleFacts;
  keyphrase: string | null;
}) {
  const { total, length } = facts;
  const uses = facts.keyphrase?.uses.length ?? 0;
  const [shared, ...also] = facts.sharedWords ?? [];
  return (
    <dl className="divide-y divide-border rounded-md border border-border bg-card px-3 text-table">
      {facts.keyphrase && keyphrase && (
        <Fact term="Keyword">
          {uses === 0 ? (
            <>
              None of the <span className="num">{total}</span> use “{keyphrase}”
            </>
          ) : (
            <>
              <b className="num font-semibold">
                {uses} of {total}
              </b>{" "}
              {uses === 1 ? "uses" : "use"} “{keyphrase}”;{" "}
              {counted(facts.keyphrase.leads.length, "lead")} with it
            </>
          )}
        </Fact>
      )}
      <Fact term="Length">
        Typically <b className="num font-semibold">{length.typical}</b>{" "}
        characters; {counted(length.over, "run")} past{" "}
        <span className="num">{length.limit}</span>
        {length.over > 0 && " and may be cut off"}
      </Fact>
      {shared && (
        <Fact term="Shared word">
          “{shared.word}” in{" "}
          <b className="num font-semibold">
            {shared.count} of {total}
          </b>
          {also.length > 0 &&
            `; also ${also
              .slice(0, 2)
              .map(({ word }) => `“${word}”`)
              .join(", ")}`}
        </Fact>
      )}
    </dl>
  );
}

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex gap-2 py-2">
      <dt className="w-22 shrink-0 text-muted-foreground">{term}</dt>
      <dd className="min-w-0 flex-1 text-foreground">{children}</dd>
    </div>
  );
}

/** The selected title as the results show theirs, with its length and how it compares. */
function YourPick({
  title,
  facts,
  keyphrase,
}: {
  title: string;
  facts: SerpTitleFacts;
  keyphrase: string | null;
}) {
  const { length, cutOff } = measureTitle(title, keyphrase);
  const comparison = comparePick(title, facts, keyphrase);
  return (
    <div className="rounded-md border border-border bg-surface-inset px-3 py-2.5">
      <p className="flex justify-between gap-2 text-caption font-medium text-muted-foreground">
        <span>Your pick</span>
        <span className="num">
          {length} characters{cutOff && ", may be cut off"}
        </span>
      </p>
      <p className="mt-1 text-table font-medium text-foreground">
        <KeyphraseText text={title} keyphrase={keyphrase} />
      </p>
      {comparison && (
        <p className="mt-0.5 text-caption text-muted-foreground">
          {comparison}
        </p>
      )}
    </div>
  );
}

/** What the step uses from the gate's payload; anything missing or malformed is left out. */
function readGate(gate: unknown): {
  recommendationReason: string | null;
  focusKeyphrase: string | null;
  serpTitles: SerpResult[];
} {
  const value = (gate && typeof gate === "object" ? gate : {}) as Record<
    string,
    unknown
  >;
  const text = (key: string) =>
    typeof value[key] === "string" ? (value[key] as string) : null;
  return {
    recommendationReason: text("recommendation_reason"),
    focusKeyphrase: text("focus_keyphrase"),
    serpTitles: serpResultsFromGate(value),
  };
}

/**
 * The score as a small meter and a count, then the three checks in words; a check that fails says
 * what is wrong, at weight 500 beside a dash.
 */
function ScoreLine({ score }: { score: TitleScore }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
        {/* One part per check, the met ones first, so five scores compare at a glance; the count
            beside it says the same in words. */}
        <Meter value={score.met} max={score.total} segmented />
        <span className="num">
          {score.met} of {score.total} checks
        </span>
      </span>
      {score.checks.map((check) => (
        <span
          key={check.id}
          className={cn(
            "inline-flex items-center gap-1",
            !check.met && "font-medium text-foreground",
          )}
        >
          {check.met ? (
            <Check aria-hidden className="size-3.5 text-success-600" />
          ) : (
            <Minus aria-hidden className="size-3.5 text-warning-600" />
          )}
          {check.label}
        </span>
      ))}
    </p>
  );
}
