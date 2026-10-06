"use client";

import { KeywordCard } from "@/components/keywords/keyword-card";
import {
  type KeywordRow,
  KeywordTable,
} from "@/components/keywords/keyword-table";
import type { LibraryEntry } from "@/lib/generate-content/library-item";
import {
  keywordMetrics,
  type SearchIntent,
} from "@/lib/keywords/keyword-metrics";

/**
 * A researched keyword's page in the library (plans/app/E-workflow.md §4, the library): the keyword
 * card the Select keyword step shows, with the intent to write for, and the related keywords the
 * analysis found, in the keyword table. The page puts the search results' top ten in its side pane.
 */
export function LibraryKeywordDetail({
  entry,
  intent,
  onIntentChange,
}: {
  entry: LibraryEntry;
  intent: SearchIntent | "";
  onIntentChange: (intent: SearchIntent) => void;
}) {
  const { value } = entry;
  const related: KeywordRow[] = [...new Set(value.related_topics ?? [])]
    .filter(Boolean)
    .map((keyword) => ({ id: keyword, keyword }));

  return (
    <div className="flex flex-col gap-6">
      <KeywordCard
        keyword={value.original_query}
        showKeyword={false}
        metrics={keywordMetrics(value.seo_state)}
        intent={intent}
        onIntentChange={onIntentChange}
      />
      {related.length > 0 && (
        <section aria-label="Related keywords" className="flex flex-col gap-3">
          <h2 className="text-section text-foreground">Related keywords</h2>
          <KeywordTable caption="Related keywords" rows={related} />
        </section>
      )}
    </div>
  );
}
