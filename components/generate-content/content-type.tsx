"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getContentTypeConfig } from "@/config/content-types";
import {
  arrangeContentTypes,
  contentTypeLabel,
  evidenceParts,
  readSerpEvidence,
} from "@/lib/generate-content/content-type-step";
import {
  formatWordCountRange,
  getContentTypeWordCountRange,
} from "@/lib/generate-content/content-type-word-count";
import { cn } from "@/lib/utils";

interface ContentTypeProps {
  recommendedContentType?: string | null;
  /** The content-type gate's interrupt value: its `recommendation_reason`, `serp_evidence` and
   * `search_intent` are read here, and only while it is that gate's. */
  gate?: Record<string, unknown> | null;
  instruction: string;
  contentTypes: string[];
  intent?: string;
  keyword?: string | null;
  handleContentTypeSelect: (type: string) => void;
}

export default function ContentType({
  recommendedContentType,
  gate,
  instruction,
  contentTypes,
  intent,
  keyword,
  handleContentTypeSelect,
}: ContentTypeProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (
      recommendedContentType &&
      contentTypes.includes(recommendedContentType)
    ) {
      setSelectedType(recommendedContentType);
    }
  }, [recommendedContentType, contentTypes]);

  const ownGate = gate?.type === "content_type" ? gate : null;
  const evidence = readSerpEvidence(ownGate?.serp_evidence);
  const evidenceLine = evidenceParts(evidence);
  const reason =
    typeof ownGate?.recommendation_reason === "string"
      ? ownGate.recommendation_reason.trim()
      : "";
  // The candidates are the backend's list for the intent it read, so that intent orders them.
  const gateIntent =
    typeof ownGate?.search_intent === "string" ? ownGate.search_intent : "";
  const { shown, more } = arrangeContentTypes(contentTypes, {
    recommended: recommendedContentType,
    intent: gateIntent || intent,
    serpTypes: evidence?.dominantFormat?.contentTypes,
  });
  // A type picked under "More types" stays in view when the list is folded again.
  const keptInView =
    !moreOpen && selectedType && more.includes(selectedType)
      ? [selectedType]
      : [];

  const card = (type: string) => (
    <TypeCard
      key={type}
      type={type}
      keyword={keyword}
      intent={gateIntent || intent}
      selected={selectedType === type}
      recommended={recommendedContentType === type}
      reason={recommendedContentType === type ? reason : ""}
      onSelect={() => setSelectedType(type)}
    />
  );

  return (
    <div className="w-full py-3">
      <div className="mb-4 space-y-2">
        <h2 className="text-page-title text-foreground">{instruction}</h2>
        {evidenceLine.length > 0 && (
          <p className="num text-body text-muted-foreground">
            {evidenceLine.map((part, index) => (
              <span key={part}>
                {index > 0 && <span aria-hidden="true"> · </span>}
                {part}
              </span>
            ))}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {[...shown, ...keptInView].map(card)}
      </div>

      {more.length > 0 && (
        <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="mt-3">
              {moreOpen ? "Fewer types" : `More types (${more.length})`}
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "transition-transform duration-(--duration-base) ease-out",
                  moreOpen && "rotate-180",
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {more.map(card)}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <div className="mt-6 flex justify-end">
        <Button
          disabled={!selectedType}
          onClick={() => selectedType && handleContentTypeSelect(selectedType)}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

function TypeCard({
  type,
  keyword,
  intent,
  selected,
  recommended,
  reason,
  onSelect,
}: {
  type: string;
  keyword?: string | null;
  intent?: string;
  selected: boolean;
  recommended: boolean;
  reason: string;
  onSelect: () => void;
}) {
  const { icon: Icon, description } = getContentTypeConfig(type);
  const text = description
    .replace(/\{keyword\}/g, keyword?.trim() || "this keyword")
    .replace(/\{intent\}/g, intent?.trim() || "relevant");
  const wordBand = getContentTypeWordCountRange(type);
  const id = useId();
  const described = [
    `${id}-text`,
    reason && `${id}-reason`,
    wordBand && `${id}-words`,
  ]
    .filter(Boolean)
    .join(" ");

  // A button holds phrasing content only, so the card's lines are spans.
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-labelledby={`${id}-label`}
      aria-describedby={described}
      onClick={onSelect}
      className={cn(
        "flex h-full w-full cursor-pointer flex-col items-start gap-2 rounded-(--card-radius) border bg-surface-raised p-4 text-left outline-none transition-colors duration-(--duration-fast) ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected ? "border-foreground" : "border-border hover:bg-surface-inset",
      )}
    >
      <span className="flex w-full items-start gap-2">
        <Icon
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-muted-foreground"
        />
        <span
          id={`${id}-label`}
          className="min-w-0 flex-1 text-section text-foreground"
        >
          {contentTypeLabel(type)}
          {recommended && <span className="sr-only"> (recommended)</span>}
        </span>
        {selected && (
          <Check aria-hidden="true" className="mt-1 size-4 shrink-0" />
        )}
      </span>
      {/* Its own line, so a narrow card never squeezes the name. */}
      {recommended && (
        <span aria-hidden="true" className={badgeVariants()}>
          Recommended
        </span>
      )}
      <span
        id={`${id}-text`}
        className="block text-table text-muted-foreground"
      >
        {text}
      </span>
      {reason && (
        <span
          id={`${id}-reason`}
          className="block w-full border-t border-border pt-2 text-table text-foreground"
        >
          <span className="font-medium">Why: </span>
          {reason}
        </span>
      )}
      {wordBand && (
        <span
          id={`${id}-words`}
          className="num mt-auto block text-caption text-muted-foreground"
        >
          {formatWordCountRange(wordBand)}
        </span>
      )}
    </button>
  );
}
