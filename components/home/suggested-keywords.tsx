import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  type LibraryEntry,
  libraryStartQuery,
} from "@/lib/generate-content/library-item";
import { workspaceRoutes } from "@/lib/routes";
import { searchVolume } from "./home-data";

function facts(entry: LibraryEntry) {
  const volume = searchVolume(entry);
  const difficulty = entry.value.seo_state?.keyword_difficulty;
  return [
    volume !== null ? `${volume.toLocaleString()} searches a month` : null,
    typeof difficulty === "number" ? `difficulty ${difficulty}` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * Suggested next keywords (plans/app/D-pages.md §2.1): keywords already researched that no article is
 * written on yet, the most searched first. "Plan" starts an article from the keyword's research, as
 * the Library's "Use keyword" does, without researching it again.
 */
export function SuggestedKeywords({
  slug,
  entries,
}: {
  slug: string;
  entries: LibraryEntry[];
}) {
  return (
    <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
      {entries.map((entry) => (
        <li
          key={entry.key}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3"
        >
          <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
            <p className="truncate text-sm font-medium text-foreground">
              {entry.value.original_query}
            </p>
            <p className="num text-sm text-muted-foreground">
              {facts(entry) || "Researched"}
            </p>
          </div>
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
        </li>
      ))}
    </ul>
  );
}
