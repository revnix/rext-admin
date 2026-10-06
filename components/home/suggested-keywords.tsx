import type { Route } from "next";
import Link from "next/link";
import { KeywordCard } from "@/components/keywords/keyword-card";
import { Button } from "@/components/ui/button";
import {
  type LibraryEntry,
  libraryStartQuery,
} from "@/lib/generate-content/library-item";
import { keywordMetrics } from "@/lib/keywords/keyword-metrics";
import { workspaceRoutes } from "@/lib/routes";

/**
 * Suggested next keywords (plans/app/D-pages.md §2.1): keywords already researched that no article is
 * written on yet, the most searched first. "Plan" starts an article from the saved keyword, as the
 * Library's "Use keyword" does; the run checks the search results again.
 */
export function SuggestedKeywords({
  slug,
  entries,
  canGenerate,
}: {
  slug: string;
  entries: LibraryEntry[];
  /** "Plan" starts a run, so it shows only to someone who may (`content.create`). */
  canGenerate: boolean;
}) {
  return (
    <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
      {entries.map((entry) => (
        <li key={entry.key} className="px-4 py-3">
          <KeywordCard
            size="compact"
            keyword={entry.value.original_query}
            metrics={keywordMetrics(entry.value.seo_state)}
            className="min-w-0 flex-1"
            action={
              canGenerate && (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={
                      `${workspaceRoutes.generate_content(slug)}?${libraryStartQuery(entry.key)}` as Route
                    }
                  >
                    Plan
                    <span className="sr-only">
                      {" "}
                      an article on {entry.value.original_query}
                    </span>
                  </Link>
                </Button>
              )
            }
          />
        </li>
      ))}
    </ul>
  );
}
