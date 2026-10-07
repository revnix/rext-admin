import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { workspaceRoutes } from "@/lib/routes";
import type { PublishState, RecentPublish } from "./home-data";

const STATE: Record<
  PublishState,
  { label: string; variant: "success" | "neutral" | "danger" }
> = {
  published: { label: "Published", variant: "success" },
  scheduled: { label: "Scheduled", variant: "neutral" },
  draft: { label: "Draft on site", variant: "neutral" },
  failed: { label: "Failed", variant: "danger" },
};

/** The latest publishes to the workspace's sites, failures flagged (FB2.27 #708, option B). */
export function PublishingCard({
  slug,
  items,
  failed,
}: {
  slug: string;
  items: RecentPublish[];
  failed: number;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-section">Publishing</h3>
        {failed > 0 && <Badge variant="danger">{`${failed} failed`}</Badge>}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Articles you send to your sites show here, with any that didn't go
          out.
        </p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {items.map((item) => (
            <li
              key={`${item.articleId}-${item.siteId}`}
              className="flex items-center justify-between gap-3 py-2"
            >
              <span className="min-w-0">
                <Link
                  href={
                    workspaceRoutes.contentDetail(slug, item.articleId) as Route
                  }
                  className="block truncate text-foreground hover:underline"
                >
                  {item.title}
                </Link>
                <span className="text-caption text-muted-foreground">
                  {item.site}
                </span>
              </span>
              <Badge variant={STATE[item.state].variant}>
                {STATE[item.state].label}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
