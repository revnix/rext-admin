"use client";

import {
  ArrowRight,
  Check,
  Loader2,
  Minus,
  Pencil,
  RefreshCcw,
} from "lucide-react";
import { useEffect, useId, useState } from "react";

import { SerpSnapshot } from "@/components/keywords/serp-snapshot";
import { WithSidePane } from "@/components/layouts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  normalizeTitle,
  scoreTitle,
  type TitleScore,
} from "@/lib/generate-content/title-score";
import type { SerpResult } from "@/lib/keywords/serp-results";
import { cn } from "@/lib/utils";

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

/**
 * Step 4, Title (plans/app/E-workflow.md §4): the five candidates as a list, each with a small score
 * (lib/generate-content/title-score.ts), any of them editable before Continue, and the search
 * results' top ten beside them so the pattern is visible (research 04 §2.3).
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
  const { recommendationReason, focusKeyphrase, serpTitles } = readGate(gate);
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

      <fieldset
        disabled={isRegenerating}
        className={cn("mb-6", isRegenerating && "opacity-40")}
      >
        <legend className="sr-only">Titles</legend>
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
                  "flex items-start gap-3 rounded-md border bg-card p-4 transition-colors",
                  isSelected
                    ? "border-primary"
                    : "border-border hover:bg-surface-inset",
                )}
              >
                <input
                  type="radio"
                  id={id}
                  name={group}
                  checked={isSelected}
                  onChange={() => setSelected(index)}
                  className="mt-1 size-4 shrink-0 accent-primary"
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
                        "block cursor-pointer text-sm leading-snug text-foreground",
                        isSelected && "font-medium",
                      )}
                    >
                      {draft}
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

      <div className="mt-8 flex justify-end">
        <Button
          onClick={() => chosen && onContinue(chosen)}
          disabled={!chosen || isRegenerating}
          className="min-w-[140px]"
        >
          Continue
          <ArrowRight />
        </Button>
      </div>
    </div>
  );

  if (serpTitles.length === 0) return list;
  return (
    <WithSidePane
      sideTitle="Top search results"
      side={<SerpSnapshot results={serpTitles} />}
    >
      {list}
    </WithSidePane>
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
  const results = Array.isArray(value.serp_titles) ? value.serp_titles : [];
  return {
    recommendationReason: text("recommendation_reason"),
    focusKeyphrase: text("focus_keyphrase"),
    serpTitles: results.filter(
      (result): result is SerpResult =>
        !!result &&
        typeof result === "object" &&
        typeof result.title === "string",
    ),
  };
}

/** The score as a count and the three checks in words; a check that fails says what is wrong. */
function ScoreLine({ score }: { score: TitleScore }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
      <span className="font-medium tabular-nums text-foreground">
        {score.met} of {score.total}
      </span>
      {score.checks.map((check) => (
        <span key={check.id} className="inline-flex items-center gap-1">
          {check.met ? (
            <Check aria-hidden className="size-3.5 text-success-700" />
          ) : (
            <Minus aria-hidden className="size-3.5 text-warning-700" />
          )}
          {check.label}
        </span>
      ))}
    </p>
  );
}
