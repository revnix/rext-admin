"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { useId, useLayoutEffect, useState } from "react";

import { RefreshCw, UserPlus, X } from "lucide-react";
import { PersonaDialog } from "@/components/personas/persona-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { useShowAfter } from "@/hooks/use-show-after";
import type { WordCountRange } from "@/lib/generate-content/content-type-word-count";
import type { BrandProminence } from "@/lib/generate-content/outline-review";
import type {
  BrandVoicePromotion,
  InternalLinkSuggestion,
  Outline,
  PersonaRecommendation,
} from "@/types/generate-content";
import type { Persona } from "@/types/workspace";
import { PersonaPicker } from "./persona-picker";

// What the article does under each choice, as the backend holds it to (FB2.19):
// each line is a promise the writer and the article's checks keep.
const PROMINENCE: {
  value: BrandProminence;
  label: string;
  description: string;
}[] = [
  {
    value: "prominent",
    label: "Prominent",
    description:
      "Named in the opening and in the closing call to action, with what it offers.",
  },
  {
    value: "subtle",
    label: "Subtle",
    description:
      "One natural mention early in the body. Never in the title, a heading or the call to action.",
  },
  {
    value: "none",
    label: "None",
    description:
      "Not named and not linked anywhere: the title, the body, the call to action or the meta tags.",
  },
];

export interface OutlineBriefProps {
  outline: Outline;
  canEdit: boolean;
  /** A word count the user asked for in feedback, while the outline is being redone. */
  pendingTargetWordCount?: number | null;
  wordCountRange?: WordCountRange | null;
  onUpdate?: (outline: Outline) => void;
  personas: Persona[];
  personaRecommendations: PersonaRecommendation[];
  personaId: string | null;
  onPersonaChange: (personaId: string | null) => void;
  /** Reload the workspace's personas, for one made in another tab or page (FB2.20). */
  onRefreshPersonas?: () => void;
  refreshingPersonas?: boolean;
  /** The first load of the personas: no list yet, so neither the picker nor "none yet". */
  personasLoading?: boolean;
  /** The personas couldn't be loaded and none are held from before. */
  personasFailed?: boolean;
  /** The user's role may create a persona (persona.create); without it, no Create persona. */
  canCreatePersona?: boolean;
  brandPromotion: BrandVoicePromotion | null;
  /** The level the gate preselects, marked "recommended". */
  recommendedProminence: BrandProminence | null;
  prominence: BrandProminence;
  onProminenceChange: (prominence: BrandProminence) => void;
  internalLinks: InternalLinkSuggestion[];
  selectedLinkUrls: Set<string>;
  onToggleLink: (url: string, selected: boolean) => void;
}

/**
 * The brief beside the outline: what the article is written for and how
 * (tone, audience, length), what it is held to (the keyphrase, the schema
 * type, the keywords to include), who writes it, how much it names the brand,
 * and which of the site's own pages it links to. A side pane from 1024 px, a
 * sheet beneath.
 */
export function OutlineBrief({
  outline,
  canEdit,
  pendingTargetWordCount,
  wordCountRange,
  onUpdate,
  personas,
  personaRecommendations,
  personaId,
  onPersonaChange,
  onRefreshPersonas,
  refreshingPersonas = false,
  personasLoading = false,
  personasFailed = false,
  canCreatePersona = false,
  brandPromotion,
  recommendedProminence,
  prominence,
  onProminenceChange,
  internalLinks,
  selectedLinkUrls,
  onToggleLink,
}: OutlineBriefProps) {
  const ids = useId();
  const showPersonasSkeleton = useShowAfter(personasLoading);
  const targetWords = pendingTargetWordCount ?? outline.target_word_count;
  const audience = outline.target_audience?.join(", ") ?? "";
  // Every persona scored, and none whose expertise covers the subject (E26).
  const noPersonaFits =
    personaRecommendations.length > 0 &&
    personaRecommendations.every(
      (recommendation) => recommendation.fits_topic === false,
    );

  return (
    <div className="space-y-6">
      <BriefGroup title="Writing">
        <TextSetting
          id={`${ids}-tone`}
          label="Tone"
          value={outline.tone ?? ""}
          disabled={!canEdit}
          onCommit={(tone) => onUpdate?.({ ...outline, tone })}
        />
        <TextSetting
          id={`${ids}-audience`}
          label="Audience"
          help="Separate several with commas."
          value={audience}
          disabled={!canEdit}
          onCommit={(value) =>
            onUpdate?.({
              ...outline,
              target_audience: value
                .split(",")
                .map((part) => part.trim())
                .filter(Boolean),
            })
          }
        />
        {targetWords ? (
          <TextSetting
            id={`${ids}-words`}
            label="Target words"
            numeric
            help={
              pendingTargetWordCount != null
                ? "Applying your feedback…"
                : wordCountRange
                  ? `Between ${wordCountRange.min.toLocaleString()} and ${wordCountRange.max.toLocaleString()} for this content type.`
                  : undefined
            }
            value={String(targetWords)}
            disabled={!canEdit || pendingTargetWordCount != null}
            onCommit={(value) => {
              const count = Number(value);
              if (Number.isFinite(count) && count > 0)
                onUpdate?.({
                  ...outline,
                  target_word_count: Math.round(count),
                });
            }}
          />
        ) : null}
      </BriefGroup>

      <BriefGroup title="Search">
        {outline.schema_type && (
          <Fact label="Content type">{outline.schema_type}</Fact>
        )}
        <KeywordsSetting
          id={`${ids}-keywords`}
          focus={outline.focus_keyphrase ?? ""}
          keywords={outline.keywords_to_include ?? []}
          disabled={!canEdit}
          onChange={(keywords_to_include) =>
            onUpdate?.({ ...outline, keywords_to_include })
          }
        />
      </BriefGroup>

      <BriefGroup title="Author">
        {personasLoading ? (
          showPersonasSkeleton && (
            <Skeleton
              role="status"
              aria-label="Loading personas"
              className="h-9 w-full"
            />
          )
        ) : personasFailed ? (
          <Notice
            tone="danger"
            title="Your personas didn't load"
            action={
              onRefreshPersonas && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={refreshingPersonas}
                  onClick={onRefreshPersonas}
                >
                  Try again
                </Button>
              )
            }
          >
            Try again to choose the article's author.
          </Notice>
        ) : personas.length > 0 ? (
          <div className="space-y-1.5">
            <label
              htmlFor={`${ids}-persona`}
              className="text-label text-foreground"
            >
              Author persona
            </label>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <PersonaPicker
                  id={`${ids}-persona`}
                  personas={personas}
                  recommendations={personaRecommendations}
                  selectedId={personaId}
                  onSelect={onPersonaChange}
                />
              </div>
              {onRefreshPersonas && (
                <RefreshPersonasButton
                  refreshing={refreshingPersonas}
                  onRefresh={onRefreshPersonas}
                />
              )}
            </div>
            <p className="text-caption text-muted-foreground">
              {!noPersonaFits
                ? "Recommended by fit with the keyword, the title, the search intent and the content type."
                : personaId === null
                  ? "None of your personas covers this subject, so the article has no author persona. You can still pick one."
                  : "None of your personas covers this subject; the article is written as the one you picked."}
            </p>
          </div>
        ) : (
          // No persona yet: make one here, without leaving the run (FB2.20); it becomes the author.
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-table text-muted-foreground">
              No author persona yet. The article is written without one.
            </p>
            {/* The refresh is here too: the first persona may be made in another tab. */}
            <div className="flex items-center gap-2">
              {onRefreshPersonas && (
                <RefreshPersonasButton
                  refreshing={refreshingPersonas}
                  onRefresh={onRefreshPersonas}
                />
              )}
              {canCreatePersona && (
                <PersonaDialog
                  trigger={
                    <Button type="button" variant="outline">
                      <UserPlus aria-hidden />
                      Create persona
                    </Button>
                  }
                  onCreated={(id) => {
                    onRefreshPersonas?.();
                    if (id) onPersonaChange(id);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </BriefGroup>

      {brandPromotion && (
        <BriefGroup title="Brand mention">
          <div className="space-y-1 text-table text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">
                {brandPromotion.brand_name}
              </span>
              {brandPromotion.brand_url
                ? `, linked to ${brandPromotion.brand_url}`
                : ""}
            </p>
            <p>
              This article's subject matches what {brandPromotion.brand_name}{" "}
              offers by{" "}
              <span className="num">
                {Math.round(brandPromotion.score * 100)}%
              </span>
              .
            </p>
          </div>
          <RadioGroupPrimitive.Root
            aria-label={`How prominently ${brandPromotion.brand_name} is mentioned`}
            value={prominence}
            onValueChange={(value) =>
              onProminenceChange(value as BrandProminence)
            }
            className="space-y-2"
          >
            {PROMINENCE.map((option) => (
              <label
                key={option.value}
                htmlFor={`${ids}-prominence-${option.value}`}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card px-3 py-3 transition-colors hover:bg-surface-inset has-data-[state=checked]:border-primary has-data-[state=checked]:hover:bg-card"
              >
                <RadioGroupPrimitive.Item
                  id={`${ids}-prominence-${option.value}`}
                  value={option.value}
                  className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border-strong outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:border-primary"
                >
                  <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-primary" />
                </RadioGroupPrimitive.Item>
                <span className="space-y-0.5">
                  <span className="block text-label text-foreground">
                    {option.label}
                    {option.value === recommendedProminence && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · recommended
                      </span>
                    )}
                  </span>
                  <span className="block text-caption text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </RadioGroupPrimitive.Root>
        </BriefGroup>
      )}

      {internalLinks.length > 0 && (
        <BriefGroup
          title="Internal links"
          aside={
            <span className="text-table text-muted-foreground num">
              {selectedLinkUrls.size} of {internalLinks.length} selected
            </span>
          }
        >
          <p className="text-caption text-muted-foreground">
            Pages of this site the article links to; those 50% relevant or more
            are selected.
          </p>
          <ul className="divide-y divide-border rounded-md border border-border">
            {internalLinks.map((link) => {
              const checked = selectedLinkUrls.has(link.url);
              const checkboxId = `${ids}-link-${link.url}`;
              return (
                <li key={link.url}>
                  <label
                    htmlFor={checkboxId}
                    className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-surface-inset"
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={checked}
                      onCheckedChange={(value) =>
                        onToggleLink(link.url, value === true)
                      }
                      className="mt-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-table font-medium text-foreground">
                        {link.title}
                      </span>
                      <span className="block truncate text-caption text-muted-foreground">
                        {link.url}
                      </span>
                    </span>
                    <span className="shrink-0 text-caption text-muted-foreground num">
                      {Math.round(link.score * 100)}%
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </BriefGroup>
      )}
    </div>
  );
}

/** Reloads the workspace's personas, for one made in another tab or page (FB2.20). */
function RefreshPersonasButton({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Refresh personas"
      title="Refresh personas"
      disabled={refreshing}
      onClick={onRefresh}
    >
      <RefreshCw
        aria-hidden
        className={
          refreshing ? "animate-spin motion-reduce:animate-none" : undefined
        }
      />
    </Button>
  );
}

function BriefGroup({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-section text-foreground">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-caption text-muted-foreground">{label}</p>
      <div className="text-body text-foreground">{children}</div>
    </div>
  );
}

/** As many keywords, and as long, as the backend takes at approval. */
export const MAX_SECONDARY_KEYWORDS = 20;
export const MAX_KEYWORD_LENGTH = 80;

const sameKeyword = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * The keywords the article is written for (FB2.18): the focus keyphrase, which is the search
 * the article answers and so is fixed here, and the secondary keywords, which the user can
 * remove and add to. The writer uses each secondary keyword at least once.
 */
function KeywordsSetting({
  id,
  focus,
  keywords,
  disabled,
  onChange,
}: {
  id: string;
  focus: string;
  keywords: string[];
  disabled: boolean;
  onChange: (keywords: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const secondary = keywords.filter(
    (keyword) => keyword.trim() && !sameKeyword(keyword, focus),
  );
  const full = secondary.length >= MAX_SECONDARY_KEYWORDS;
  // The focus keyphrase leads the list approval sends, as the backend keeps it.
  const send = (next: string[]) => onChange(focus ? [focus, ...next] : next);
  const add = () => {
    const keyword = draft.replace(/\s+/g, " ").trim();
    setDraft("");
    if (
      !keyword ||
      full ||
      keyword.length > MAX_KEYWORD_LENGTH ||
      sameKeyword(keyword, focus) ||
      secondary.some((existing) => sameKeyword(existing, keyword))
    )
      return;
    send([...secondary, keyword]);
  };
  if (!focus && secondary.length === 0 && disabled) return null;

  return (
    <div className="space-y-2">
      <p className="text-label text-foreground">Keywords</p>
      <ul
        aria-label="Keywords the article uses"
        className="flex flex-wrap gap-2"
      >
        {focus && (
          <li className="inline-flex max-w-full items-center gap-2 rounded-md border border-primary bg-card px-2 py-1 text-label text-foreground">
            <span className="break-words">{focus}</span>
            <span className="shrink-0 text-caption text-muted-foreground">
              Primary
            </span>
          </li>
        )}
        {secondary.map((keyword) => (
          <li
            key={keyword}
            className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-card py-1 pr-1 pl-2 text-label text-foreground"
          >
            <span className="break-words">{keyword}</span>
            {!disabled && (
              <button
                type="button"
                aria-label={`Remove ${keyword}`}
                onClick={() =>
                  send(secondary.filter((existing) => existing !== keyword))
                }
                className="flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-surface-inset hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {!disabled && (
        <div className="flex gap-2">
          <Input
            id={id}
            value={draft}
            maxLength={MAX_KEYWORD_LENGTH}
            disabled={full}
            placeholder="Add a keyword"
            aria-label="Add a keyword"
            aria-describedby={`${id}-help`}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                add();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={full || !draft.trim()}
            onClick={add}
          >
            Add
          </Button>
        </div>
      )}
      <p id={`${id}-help`} className="text-caption text-muted-foreground">
        {full
          ? `That's the most an article takes (${MAX_SECONDARY_KEYWORDS}). Remove one to add another.`
          : "The primary keyword is the search this article answers. The article uses each of the others at least once."}
      </p>
    </div>
  );
}

/** A setting edited in place: saved when it loses focus or on Enter; Escape puts it back. */
function TextSetting({
  id,
  label,
  help,
  value,
  numeric = false,
  disabled,
  onCommit,
}: {
  id: string;
  label: string;
  help?: string;
  value: string;
  numeric?: boolean;
  disabled: boolean;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  // Before paint, so an accepted edit never shows the old value for a frame.
  useLayoutEffect(() => setDraft(value), [value]);
  const commit = () => {
    const next = draft.trim();
    if (next && next !== value) onCommit(next);
    // An accepted edit comes back as the new value; a rejected one (not a
    // number, outside the type's range) leaves the field as it was, so it never
    // shows a value approval won't send.
    setDraft(value);
  };
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-label text-foreground">
        {label}
      </label>
      <Input
        id={id}
        value={draft}
        disabled={disabled}
        inputMode={numeric ? "numeric" : undefined}
        aria-describedby={help ? `${id}-help` : undefined}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          } else if (event.key === "Escape") setDraft(value);
        }}
        className={numeric ? "num" : undefined}
      />
      {help && (
        <p id={`${id}-help`} className="text-caption text-muted-foreground">
          {help}
        </p>
      )}
    </div>
  );
}
