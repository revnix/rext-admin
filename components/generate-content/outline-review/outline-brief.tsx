"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { useId, useLayoutEffect, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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

const PROMINENCE: {
  value: BrandProminence;
  label: string;
  description: string;
}[] = [
  {
    value: "prominent",
    label: "Prominent",
    description:
      "Named in the opening and the closing call to action, with what it offers.",
  },
  {
    value: "subtle",
    label: "Subtle",
    description: "One natural mention in the body.",
  },
  { value: "none", label: "None", description: "Not mentioned." },
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
  brandPromotion,
  recommendedProminence,
  prominence,
  onProminenceChange,
  internalLinks,
  selectedLinkUrls,
  onToggleLink,
}: OutlineBriefProps) {
  const ids = useId();
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
        {outline.focus_keyphrase && (
          <Fact label="Focus keyphrase">{outline.focus_keyphrase}</Fact>
        )}
        {outline.schema_type && (
          <Fact label="Schema type">{outline.schema_type}</Fact>
        )}
        {outline.keywords_to_include?.length > 0 && (
          <Fact label="Keywords to include">
            <span className="flex flex-wrap gap-1.5 pt-0.5">
              {outline.keywords_to_include.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-sm border border-border bg-surface-inset px-1.5 py-0.5 text-table text-foreground"
                >
                  {keyword}
                </span>
              ))}
            </span>
          </Fact>
        )}
      </BriefGroup>

      {personas.length > 0 && (
        <BriefGroup title="Author">
          <div className="space-y-1.5">
            <label
              htmlFor={`${ids}-persona`}
              className="text-label text-foreground"
            >
              Author persona
            </label>
            <PersonaPicker
              id={`${ids}-persona`}
              personas={personas}
              recommendations={personaRecommendations}
              selectedId={personaId}
              onSelect={onPersonaChange}
            />
            <p className="text-caption text-muted-foreground">
              {!noPersonaFits
                ? "Recommended by fit with the keyword, the title, the search intent and the content type."
                : personaId === null
                  ? "None of your personas covers this subject, so the article has no author persona. You can still pick one."
                  : "None of your personas covers this subject; the article is written as the one you picked."}
            </p>
          </div>
        </BriefGroup>
      )}

      {brandPromotion && (
        <BriefGroup title="Brand mention">
          <p className="text-table text-muted-foreground">
            <span className="font-medium text-foreground">
              {brandPromotion.brand_name}
            </span>
            {brandPromotion.brand_url
              ? `, linked to ${brandPromotion.brand_url}`
              : ""}
            <span className="num">
              {" "}
              · {Math.round(brandPromotion.score * 100)}% match
            </span>
          </p>
          <RadioGroupPrimitive.Root
            aria-label={`How prominently ${brandPromotion.brand_name} is mentioned`}
            value={prominence}
            onValueChange={(value) =>
              onProminenceChange(value as BrandProminence)
            }
            className="divide-y divide-border rounded-md border border-border"
          >
            {PROMINENCE.map((option) => (
              <label
                key={option.value}
                htmlFor={`${ids}-prominence-${option.value}`}
                className="flex cursor-pointer items-start gap-3 px-3 py-2.5 first:rounded-t-md last:rounded-b-md hover:bg-surface-inset has-data-[state=checked]:bg-surface-inset"
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
