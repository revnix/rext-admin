import { WorkspaceFavicon } from "@/components/shell/workspace-favicon";
import { EmptyState } from "@/components/ui/empty-state";
import { splitByKeyphrase } from "@/lib/generate-content/keyphrase-match";
import { formatLabel, type SerpResult } from "@/lib/keywords/serp-results";
import { cn } from "@/lib/utils";

/**
 * The search results' top ten (plans/app/E-workflow.md §4, steps 2 and 4; the library): each
 * result's position, its title (a link to the page when there is an address) and, beneath, its
 * domain and format. Narrow enough for a side pane of 320 px; the pane or sheet around it is the
 * layout's. The title step opts in to more (task 695): the keyphrase in bold, each title's length,
 * and the domain's first letter as a mark.
 */
export function SerpSnapshot({
  results,
  heading = "Top search results",
  keyphrase,
  measure,
  marks = false,
  className,
}: {
  results: readonly SerpResult[];
  /** Null when the pane around it already names it. */
  heading?: string | null;
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
