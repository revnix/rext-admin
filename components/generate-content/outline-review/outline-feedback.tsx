import { ArrowLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { WordCountRange } from "@/lib/generate-content/content-type-word-count";
import { RunCostTooltip } from "../run-cost";

/**
 * What should change before the outline is written again: the feedback path of Regenerate. Back
 * returns to the outline as it was, sending nothing and billing nothing (E7.3, rext-control#595);
 * only Submit feedback writes it again, for its credit.
 */
export function OutlineRejectSection({
  instruction,
  rejectedReason,
  contentType,
  wordCountRange,
  onChange,
  onSubmit,
  onBack,
}: {
  instruction: string;
  rejectedReason: string;
  contentType?: string;
  wordCountRange?: WordCountRange | null;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl py-3">
      <div className="rounded-md border border-border bg-card p-6">
        <p className="text-caption text-muted-foreground">Feedback</p>
        <h3 className="mb-4 text-section text-foreground">{instruction}</h3>
        <Textarea
          aria-label={instruction}
          value={rejectedReason}
          onChange={(event) => onChange(event.target.value)}
          placeholder={instruction}
          className="min-h-36 w-full text-body"
        />
        {wordCountRange && (
          <p className="mt-3 text-caption text-muted-foreground">
            {contentType || "This content type"} supports between{" "}
            {wordCountRange.min.toLocaleString()} and{" "}
            {wordCountRange.max.toLocaleString()} words.
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft />
            Back to the outline
          </Button>
          <RunCostTooltip run="regenerate_outline">
            <Button onClick={onSubmit}>
              Submit feedback
              <ChevronRight />
            </Button>
          </RunCostTooltip>
        </div>
      </div>
    </div>
  );
}
