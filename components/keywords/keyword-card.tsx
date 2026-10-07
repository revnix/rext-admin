"use client";

import { type ReactNode, useId } from "react";
import { MonthlyVolume } from "@/components/ui/content/monthly-volume-card";
import { DifficultyRing } from "./difficulty-ring";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  describeMonthlyVolume,
  formatCompactVolume,
} from "@/lib/generate-content/monthly-volume";
import {
  difficultyBand,
  formatCount,
  intentLabel,
  isSearchIntent,
  type KeywordMetrics,
  SEARCH_INTENTS,
  type SearchIntent,
} from "@/lib/keywords/keyword-metrics";
import { cn } from "@/lib/utils";

const UNKNOWN = "—";

/** The difficulty as a ring in its level's colour, the level and the number beside it (FB2.9 #690):
 * "Hard", 42%. Also the keyword table's cell, as a small ring. */
export function KeywordDifficulty({
  score,
  compact = false,
}: {
  score: number | null;
  compact?: boolean;
}) {
  const band = difficultyBand(score);
  if (score === null || !band) {
    return <span className="text-muted-foreground">{UNKNOWN}</span>;
  }
  if (compact) {
    return (
      <span className="flex items-center gap-1.5">
        <DifficultyRing score={score} band={band} size="sm" />
        <span className="text-table">{band}</span>
        <span className="num text-caption text-muted-foreground">{score}</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-3">
      <DifficultyRing score={score} band={band} />
      <span className="text-section">{band}</span>
    </span>
  );
}

/** The intent the run will write for: the search results' consensus, or the user's choice. */
function Intent({
  intents,
  intent,
  onIntentChange,
}: {
  intents: SearchIntent[];
  intent: SearchIntent | "";
  onIntentChange?: (intent: SearchIntent) => void;
}) {
  const selectId = useId();
  const [consensus, recommended] = intents;
  const shown = intent || consensus;
  const notes = [
    consensus && `Search results: ${intentLabel(consensus)}`,
    recommended &&
      recommended !== consensus &&
      `Suggested: ${intentLabel(recommended)}`,
  ].filter(Boolean);

  return (
    <span className="flex flex-col gap-1.5">
      {onIntentChange ? (
        <>
          <label htmlFor={selectId} className="sr-only">
            Search intent to write for
          </label>
          <Select
            value={shown ?? ""}
            onValueChange={(value) => {
              if (isSearchIntent(value)) onIntentChange(value);
            }}
          >
            <SelectTrigger id={selectId} className="h-8 w-full max-w-48">
              <SelectValue placeholder="Choose an intent" />
            </SelectTrigger>
            <SelectContent>
              {SEARCH_INTENTS.map((value) => (
                <SelectItem key={value} value={value}>
                  {intentLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      ) : (
        <span className="text-section">
          {shown ? intentLabel(shown) : UNKNOWN}
        </span>
      )}
      {notes.length > 0 && (
        <span className="text-caption text-muted-foreground">
          {notes.join(" · ")}
        </span>
      )}
    </span>
  );
}

function Fact({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <dt className="text-label text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function Count({ value }: { value: number | null }) {
  return value === null ? (
    <span className="text-muted-foreground">{UNKNOWN}</span>
  ) : (
    <span className="num text-section">{formatCount(value)}</span>
  );
}

export interface KeywordCardProps {
  keyword: string;
  metrics: KeywordMetrics;
  /**
   * `expanded`: every fact, with backlinks and referring domains, for the keyword step and the
   * library's detail; `compact`: one line of facts, for a list on a phone.
   */
  size?: "compact" | "expanded";
  /** The intent the run will write for; empty means the search results' consensus. */
  intent?: SearchIntent | "";
  /** Lets the user override the consensus (expanded size). */
  onIntentChange?: (intent: SearchIntent) => void;
  /** False where the page's title already is the keyword (the library's keyword page). */
  showKeyword?: boolean;
  /** Above the keyword: what it is ("Searched keyword", "Researched 2 hours ago"). */
  eyebrow?: ReactNode;
  /** Beside the keyword: what to do with it ("Use this keyword"). */
  action?: ReactNode;
  className?: string;
}

/**
 * One researched keyword (plans/app/E-workflow.md §3 item 3, design/app-language.md §6): its monthly
 * searches, its difficulty as a band and a bar, the search intent with the search results' consensus
 * (and the user's override where the run can take it) and, expanded, its backlinks and referring
 * domains. The same card on the keyword step, in the library's list on a phone and in its detail.
 */
export function KeywordCard({
  keyword,
  metrics,
  size = "expanded",
  showKeyword = true,
  intent = "",
  onIntentChange,
  eyebrow,
  action,
  className,
}: KeywordCardProps) {
  if (size === "compact") {
    const volume = describeMonthlyVolume(metrics.volume, metrics.volumeStatus);
    const shownIntent = intent || metrics.intents[0];
    return (
      <div
        data-slot="keyword-card"
        data-size="compact"
        className={cn("flex items-start gap-3", className)}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {eyebrow && (
            <span className="text-caption text-muted-foreground">
              {eyebrow}
            </span>
          )}
          <p className="text-body font-medium text-foreground">{keyword}</p>
          <dl className="flex flex-wrap items-start gap-x-4 gap-y-1 text-table">
            <div className="flex gap-1">
              <dt className="sr-only">Monthly searches</dt>
              <dd
                className="num"
                title={volume.kind === "message" ? volume.detail : undefined}
              >
                {volume.kind === "volume"
                  ? `${formatCompactVolume(volume.volume)} searches`
                  : volume.label}
              </dd>
            </div>
            <div>
              <dt className="sr-only">Difficulty</dt>
              <dd>
                <KeywordDifficulty score={metrics.difficulty} compact />
              </dd>
            </div>
            {shownIntent && (
              <div>
                <dt className="sr-only">Search intent</dt>
                <dd>{intentLabel(shownIntent)}</dd>
              </div>
            )}
          </dl>
        </div>
        {action}
      </div>
    );
  }

  return (
    <section
      data-slot="keyword-card"
      data-size="expanded"
      aria-label={keyword}
      className={cn(
        "flex flex-col gap-4 rounded-(--card-radius) border bg-card p-4 sm:p-5",
        className,
      )}
    >
      {(showKeyword || eyebrow || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            {eyebrow && (
              <span className="text-caption text-muted-foreground">
                {eyebrow}
              </span>
            )}
            {showKeyword && (
              <p className="text-section break-words text-foreground">
                {keyword}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Fact label="Monthly searches">
          <MonthlyVolume
            volume={metrics.volume}
            status={metrics.volumeStatus}
          />
        </Fact>
        <Fact label="Difficulty">
          <KeywordDifficulty score={metrics.difficulty} />
        </Fact>
        <Fact label="Search intent" className="col-span-2 sm:col-span-1">
          <Intent
            intents={metrics.intents}
            intent={intent}
            onIntentChange={onIntentChange}
          />
        </Fact>
        <Fact label="Backlinks">
          <Count value={metrics.backlinks} />
        </Fact>
        <Fact label="Referring domains">
          <Count value={metrics.referringDomains} />
        </Fact>
      </dl>
    </section>
  );
}
