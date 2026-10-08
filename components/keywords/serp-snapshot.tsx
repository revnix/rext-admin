import type { ReactNode } from "react";
import { WorkspaceFavicon } from "@/components/shell/workspace-favicon";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { splitByKeyphrase } from "@/lib/generate-content/keyphrase-match";
import {
  describeRankingKinds,
  formatLabel,
  type SerpResult,
} from "@/lib/keywords/serp-results";
import { cn } from "@/lib/utils";

/**
 * The search results' top ten (plans/app/E-workflow.md §4, steps 2 and 4; the library): each
 * result's position, its title (a link to the page when there is an address) and, beneath, its
 * domain and format. Narrow enough for a side pane of 320 px; the pane or sheet around it is the
 * layout's. The title step opts in to more (task 695): the keyphrase in bold, each title's length,
 * and the domain's first letter as a mark. The keyword step opts in to its own (FB3.2, task 834):
 * a line on what the list is, the kinds of pages in it, and each result's kind as a tag.
 */
export function SerpSnapshot({
  results,
  heading = "Top search results",
  intro,
  kinds = false,
  keyphrase,
  measure,
  marks = false,
  className,
}: {
  results: readonly SerpResult[];
  /** Null when the pane around it already names it. */
  heading?: string | null;
  /** Under the heading: what the list is and why it matters, in a sentence or two. */
  intro?: ReactNode;
  /** The kinds of pages among the results, counted in a line above them, and each result's kind
   * as a tag with its position on a mark of its own. */
  kinds?: boolean;
  /** The focus keyphrase, in bold in each title where the title score finds it. */
  keyphrase?: string | null;
  /** Each title's length, and whether a results page may cut it off, said in the line beneath. */
  measure?: (title: string) => { length: number; cutOff: boolean };
  /** The domain's first letter beside each result, on the inset surface (no favicons are sent). */
  marks?: boolean;
  className?: string;
}) {
  return (
    <section
      data-slot="serp-snapshot"
      aria-label={heading ?? "Top search results"}
      className={cn("flex flex-col gap-3", className)}
    >
      {heading && (
        <h2 className="text-sm font-medium text-foreground">{heading}</h2>
      )}
      {intro && <p className="text-caption text-muted-foreground">{intro}</p>}
      {kinds && results.length > 0 && <RankingKinds results={results} />}
      {results.length === 0 ? (
        <EmptyState
          as={heading ? "h3" : "h2"}
          title="No search results recorded"
          description="The analysis kept no top results for this keyword."
          className="px-4 py-6"
        />
      ) : (
        <ol className="flex flex-col divide-y divide-border">
          {results.map((result) => {
            const format = formatLabel(result.format);
            const detail = [result.domain, format].filter(Boolean).join(" · ");
            const size = measure?.(result.title);
            // With the keyphrase in bold, the rest of the title is at the regular weight.
            const titleClass = cn(
              "line-clamp-2 text-sm font-medium text-foreground",
              keyphrase && "font-normal",
            );
            const title = keyphrase ? (
              <KeyphraseText text={result.title} keyphrase={keyphrase} />
            ) : (
              result.title
            );
            if (kinds) {
              return (
                <li
                  key={`${result.position}-${result.url ?? result.title}`}
                  className="flex gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="num flex size-6 shrink-0 items-center justify-center rounded-sm bg-surface-inset text-caption font-medium text-muted-foreground">
                    <span className="sr-only">Position </span>
                    {result.position}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    {result.url ? (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(titleClass, "hover:underline")}
                      >
                        {title}
                      </a>
                    ) : (
                      <p className={titleClass}>{title}</p>
                    )}
                    {(result.domain || format) && (
                      <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        {result.domain && (
                          <span className="flex min-w-0 items-center gap-1.5">
                            <WorkspaceFavicon
                              name={result.domain}
                              className="size-4"
                            />
                            <span className="truncate">{result.domain}</span>
                          </span>
                        )}
                        {format && (
                          <Badge className="px-1.5 py-0 font-medium">
                            {format}
                          </Badge>
                        )}
                      </p>
                    )}
                  </div>
                </li>
              );
            }
            return (
              <li
                key={`${result.position}-${result.url ?? result.title}`}
                className="flex gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="num w-5 shrink-0 text-right text-sm text-muted-foreground">
                  {result.position}
                </span>
                {marks && (
                  <WorkspaceFavicon
                    name={result.domain || result.title}
                    className="mt-0.5 size-4"
                  />
                )}
                <div className="min-w-0 flex-1">
                  {result.url ? (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(titleClass, "hover:underline")}
                    >
                      {title}
                    </a>
                  ) : (
                    <p className={titleClass}>{title}</p>
                  )}
                  {size ? (
                    <p className="text-xs text-muted-foreground">
                      {result.domain && `${result.domain} · `}
                      <span
                        className={cn("num", size.cutOff && "text-foreground")}
                      >
                        {size.length} characters
                        {size.cutOff && ", may be cut off"}
                      </span>
                      {format && ` · ${format}`}
                    </p>
                  ) : (
                    detail && (
                      <p className="truncate text-xs text-muted-foreground">
                        {detail}
                      </p>
                    )
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

/** The kinds of pages among the results, in one line; nothing when none is known. */
function RankingKinds({ results }: { results: readonly SerpResult[] }) {
  const kinds = describeRankingKinds(results);
  return kinds ? (
    <p
      data-slot="serp-kinds"
      className="rounded-sm bg-surface-inset px-3 py-2 text-caption text-foreground"
    >
      {kinds}
    </p>
  ) : null;
}

/**
 * The snapshot before its results arrive, shaped like them (FB3.2): a position mark, a title of one
 * or two lines, the site and the kind beneath. As many rows as the results will have at most.
 */
export function SerpSnapshotSkeleton({
  heading = "Top search results",
  intro,
  rows = 10,
  className,
}: {
  heading?: string | null;
  intro?: ReactNode;
  rows?: number;
  className?: string;
}) {
  return (
    <section
      data-slot="serp-snapshot-skeleton"
      aria-label={heading ?? "Top search results"}
      aria-busy="true"
      className={cn("flex flex-col gap-3", className)}
    >
      {heading && (
        <h2 className="text-sm font-medium text-foreground">{heading}</h2>
      )}
      {intro && <p className="text-caption text-muted-foreground">{intro}</p>}
      <Skeleton className="h-8 w-full" aria-hidden />
      <ol className="flex flex-col divide-y divide-border" aria-hidden>
        {Array.from({ length: rows }, (_, row) => (
          // The rows are alike and never reordered.
          // biome-ignore lint/suspicious/noArrayIndexKey: see above
          <li key={row} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <Skeleton className="size-6 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-full" />
              {row % 3 !== 2 && <Skeleton className="h-4 w-3/5" />}
              <div className="flex items-center gap-2">
                <Skeleton className="size-4" />
                <Skeleton className="h-3 w-24" />
                {row % 2 === 0 && <Skeleton className="h-4 w-16" />}
              </div>
            </div>
          </li>
        ))}
      </ol>
      <span className="sr-only" role="status">
        Reading the search results
      </span>
    </section>
  );
}

/** A title with the focus keyphrase in bold wherever the title score finds it. */
export function KeyphraseText({
  text,
  keyphrase,
}: {
  text: string;
  keyphrase?: string | null;
}) {
  return splitByKeyphrase(text, keyphrase).map((part, index) =>
    part.keyphrase ? (
      // The parts are the title's runs in order, so the position is the identity.
      // biome-ignore lint/suspicious/noArrayIndexKey: see above
      <b key={index} className="font-semibold">
        {part.text}
      </b>
    ) : (
      part.text
    ),
  );
}
