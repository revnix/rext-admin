import { EmptyState } from "@/components/ui/empty-state";
import { formatLabel, type SerpResult } from "@/lib/keywords/serp-results";
import { cn } from "@/lib/utils";

/**
 * The search results' top ten (plans/app/E-workflow.md §4, steps 2 and 4; the library): each
 * result's position, its title (a link to the page when there is an address) and, beneath, its
 * domain and format. Narrow enough for a side pane of 320 px; the pane or sheet around it is the
 * layout's.
 */
export function SerpSnapshot({
  results,
  heading = "Top search results",
  className,
}: {
  results: readonly SerpResult[];
  /** Null when the pane around it already names it. */
  heading?: string | null;
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
            const detail = [result.domain, formatLabel(result.format)]
              .filter(Boolean)
              .join(" · ");
            return (
              <li
                key={`${result.position}-${result.url ?? result.title}`}
                className="flex gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="num w-5 shrink-0 text-right text-sm text-muted-foreground">
                  {result.position}
                </span>
                <div className="min-w-0 flex-1">
                  {result.url ? (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="line-clamp-2 text-sm font-medium text-foreground hover:underline"
                    >
                      {result.title}
                    </a>
                  ) : (
                    <p className="line-clamp-2 text-sm font-medium text-foreground">
                      {result.title}
                    </p>
                  )}
                  {detail && (
                    <p className="truncate text-xs text-muted-foreground">
                      {detail}
                    </p>
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
