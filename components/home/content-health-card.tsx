import type { Route } from "next";
import Link from "next/link";
import { ScoreRing } from "@/components/ui/score-ring";
import type { ContentHealthCounts } from "@/lib/api-client/content";
import {
  type ContentHealth,
  HEALTHY_SCORE,
  STALE_DRAFT_DAYS,
} from "./home-data";

/**
 * The published articles' on-page scores and the drafts going stale (FB2.27 #708, the founder's
 * option B), from the content list the home already loads. `checks` are the two counts only the
 * backend can make (FB2.27a #765); the card is whole without them, while they load or fail.
 */
export function ContentHealthCard({
  health,
  checks,
  libraryHref,
}: {
  health: ContentHealth;
  checks?: ContentHealthCounts;
  libraryHref: string;
}) {
  const noDescription = checks?.missing_meta_description ?? 0;
  const noOwnLink = checks?.no_internal_links ?? 0;
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-5">
      <h3 className="text-section">Content health</h3>
      {health.average === null ? (
        <p className="text-sm text-muted-foreground">
          Your articles' on-page scores show here once one is published.
        </p>
      ) : (
        <div className="flex items-center gap-4">
          <ScoreRing value={health.average} label="Average on-page score" />
          <div className="space-y-1 text-sm">
            <p className="text-foreground">
              Average on-page score of{" "}
              <span className="num">{health.scored}</span> published{" "}
              {health.scored === 1 ? "article" : "articles"}
            </p>
            {health.underHealthy > 0 ? (
              <p className="text-muted-foreground">
                <span className="num text-foreground">
                  {health.underHealthy}
                </span>{" "}
                under {HEALTHY_SCORE} ·{" "}
                <Link
                  href={`${libraryHref}?status=published&sort=seo.asc` as Route}
                  className="link"
                >
                  Improve them
                </Link>
              </p>
            ) : (
              <p className="text-muted-foreground">
                All at {HEALTHY_SCORE} or above.
              </p>
            )}
          </div>
        </div>
      )}
      {(noDescription > 0 || noOwnLink > 0) && (
        <div className="space-y-1 border-t border-border pt-3 text-sm text-muted-foreground">
          {noDescription > 0 && (
            <p>
              <span className="num text-foreground">{noDescription}</span>{" "}
              published without a meta description
            </p>
          )}
          {noOwnLink > 0 && (
            <p>
              <span className="num text-foreground">{noOwnLink}</span> published
              with no link to your own site
            </p>
          )}
          <p>
            <Link
              href={`${libraryHref}?status=published` as Route}
              className="link"
            >
              Open the published articles
            </Link>
          </p>
        </div>
      )}
      {health.staleDrafts > 0 && (
        <p className="border-t border-border pt-3 text-sm text-muted-foreground">
          <span className="num text-foreground">{health.staleDrafts}</span>{" "}
          {health.staleDrafts === 1 ? "draft" : "drafts"} untouched for{" "}
          {STALE_DRAFT_DAYS}+ days ·{" "}
          <Link
            href={
              `${libraryHref}?status=draft,ready&sort=updated_at.asc` as Route
            }
            className="link"
          >
            Review them
          </Link>
        </p>
      )}
    </div>
  );
}
