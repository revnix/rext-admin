import { SerpSnapshot } from "@/components/keywords/serp-snapshot";
import type { CompetitorPage } from "@/lib/generate-content/outline-review";
import type { SerpResult } from "@/lib/keywords/serp-results";
import type {
  ClusterHeadingMapItem,
  KeywordCluster,
} from "@/types/generate-content";

export interface OutlineSourcesProps {
  serpResults: SerpResult[];
  questions: string[];
  relatedSearches: string[];
  /** The ranking pages' H2 and H3, as the run read them (rext-control#476). */
  competitorHeadings?: CompetitorPage[];
  clusters: KeywordCluster[];
  /** Which planned heading each cluster feeds. */
  clusterHeadings?: ClusterHeadingMapItem[];
}

/** Whether the run has anything to show as the outline's sources. */
export function hasSources(props: OutlineSourcesProps): boolean {
  return (
    props.serpResults.length > 0 ||
    props.questions.length > 0 ||
    props.relatedSearches.length > 0 ||
    (props.competitorHeadings?.length ?? 0) > 0 ||
    props.clusters.length > 0
  );
}

/**
 * What the outline rests on: the search results it was planned against, the
 * questions people ask about the keyword, the related searches, and the
 * keyword clusters with the sections each one feeds. All of it is what the run
 * read; nothing here is generated for the screen.
 */
export function OutlineSources({
  serpResults,
  questions,
  relatedSearches,
  competitorHeadings = [],
  clusters,
  clusterHeadings = [],
}: OutlineSourcesProps) {
  const headingsByCluster = new Map<string, string[]>();
  for (const { cluster, heading } of clusterHeadings) {
    headingsByCluster.set(cluster, [
      ...(headingsByCluster.get(cluster) ?? []),
      heading,
    ]);
  }

  return (
    <div className="space-y-8">
      {serpResults.length > 0 && (
        <SourceGroup
          title="Search results"
          description="The pages ranking for this keyword, which the outline was planned against."
        >
          <SerpSnapshot results={serpResults} heading={null} />
        </SourceGroup>
      )}

      {competitorHeadings.length > 0 && (
        <SourceGroup
          title="What the ranking pages cover"
          description="The headings of the top results, in each page's order."
        >
          <ul className="divide-y divide-border rounded-md border border-border bg-card">
            {competitorHeadings.map((page) => (
              <li key={page.url} className="space-y-1.5 px-3 py-2.5">
                <p className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link min-w-0 text-body font-medium wrap-anywhere"
                  >
                    {page.title || hostOf(page.url)}
                  </a>
                  <span className="text-caption text-muted-foreground">
                    {hostOf(page.url)}
                  </span>
                </p>
                <ul className="space-y-0.5">
                  {page.headings.map((heading, index) => (
                    <li
                      // A page may repeat a heading at another level.
                      // biome-ignore lint/suspicious/noArrayIndexKey: headings have no id of their own
                      key={`${heading.level}-${index}`}
                      className={
                        heading.level === 3
                          ? "pl-4 text-table text-muted-foreground"
                          : "text-table text-foreground"
                      }
                    >
                      {heading.text}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </SourceGroup>
      )}

      {questions.length > 0 && (
        <SourceGroup
          title="Questions people also ask"
          description="From the search results; the outline's sections and questions answer them."
        >
          <ul className="list-disc space-y-1 pl-5 text-body text-foreground marker:text-muted-foreground">
            {questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </SourceGroup>
      )}

      {relatedSearches.length > 0 && (
        <SourceGroup title="Related searches">
          <ul className="flex flex-wrap gap-1.5">
            {relatedSearches.map((search) => (
              <li
                key={search}
                className="rounded-sm border border-border bg-surface-inset px-1.5 py-0.5 text-table text-foreground"
              >
                {search}
              </li>
            ))}
          </ul>
        </SourceGroup>
      )}

      {clusters.length > 0 && (
        <SourceGroup
          title="Keyword clusters"
          description="Related keywords grouped by intent; each feeds the sections listed under it."
        >
          <ul className="divide-y divide-border rounded-md border border-border bg-card">
            {clusters.map((cluster) => {
              const headings =
                headingsByCluster.get(cluster.cluster_name) ?? [];
              return (
                <li
                  key={cluster.cluster_name}
                  className="space-y-1.5 px-3 py-2.5"
                >
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-body font-medium text-foreground">
                      {cluster.cluster_name}
                    </span>
                    <span className="text-caption text-muted-foreground">
                      {cluster.main_intent}
                      <span className="num">
                        {" "}
                        · {cluster.keywords.length} keywords
                      </span>
                    </span>
                  </p>
                  <p className="text-table text-muted-foreground">
                    {cluster.keywords
                      .map((keyword) => keyword.keyword)
                      .join(", ")}
                  </p>
                  {headings.length > 0 && (
                    <p className="text-caption text-muted-foreground">
                      Feeds: {headings.join("; ")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </SourceGroup>
      )}
    </div>
  );
}

function SourceGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-0.5">
        <h3 className="text-section text-foreground">{title}</h3>
        {description && (
          <p className="text-table text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

/** A page's site, for the line under its title. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
