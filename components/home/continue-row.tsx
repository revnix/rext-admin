import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { RunProgress } from "@/components/generate-content/run-progress";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { stagesAt } from "@/lib/generate-content/run-stages";
import { workspaceRoutes } from "@/lib/routes";
import {
  CONTENT_LIST_STATUS_LABELS,
  type ContentListStatus,
} from "@/lib/search-params/content";
import type { BackgroundGenerationJob } from "@/stores/background-generation-store";
import type { Content } from "@/types/content";

function Row({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href as Route}
        className="group flex items-center gap-3 px-4 py-3 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-sm font-medium text-foreground">
            {title}
          </span>
          {children}
        </span>
        <ChevronRight
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground"
        />
      </Link>
    </li>
  );
}

function RunRow({ job }: { job: BackgroundGenerationJob }) {
  const running = job.status === "queued" || job.status === "running";
  const stages =
    running && job.runStage
      ? stagesAt(
          job.runStage.phase,
          job.runStage.id,
          job.stageStartedAt ? Date.parse(job.stageStartedAt) : undefined,
        )
      : null;
  return (
    <Row href={job.resultUrl} title={job.title || job.keyword}>
      {job.awaitingInput ? (
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="info">Your turn</Badge>
          {job.stage}
        </span>
      ) : stages ? (
        <RunProgress variant="compact" stages={stages} className="max-w-sm" />
      ) : (
        <span className="truncate text-sm text-muted-foreground">
          {job.stage}
        </span>
      )}
    </Row>
  );
}

function ArticleRow({ item, slug }: { item: Content; slug: string }) {
  const status = String(item.status) as ContentListStatus;
  return (
    <Row
      href={workspaceRoutes.contentDetail(slug, item.id)}
      title={item.title || "Untitled article"}
    >
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant={status === "review" ? "info" : "neutral"}>
          {CONTENT_LIST_STATUS_LABELS[status] ?? status}
        </Badge>
        {item.updated_at && `Changed ${dateFormat.relative(item.updated_at)}`}
      </span>
    </Row>
  );
}

/**
 * Continue (plans/app/D-pages.md §2.1): the runs still going in this browser, on the run component,
 * then the articles in review and the drafts. Runs started on another device or by a teammate
 * aren't known here: the dashboard keeps its runs in the browser.
 */
export function ContinueRow({
  slug,
  runs,
  articles,
}: {
  slug: string;
  runs: BackgroundGenerationJob[];
  articles: Content[];
}) {
  if (runs.length === 0 && articles.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card">
        <EmptyState
          as="h3"
          title="Nothing in progress"
          description="Start an article from a keyword: research, a title, an outline, then the draft."
          action={{
            label: "Start an article",
            href: workspaceRoutes.generate_content(slug),
          }}
        />
      </div>
    );
  }
  return (
    <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
      {runs.map((job) => (
        <RunRow key={job.threadId} job={job} />
      ))}
      {articles.map((item) => (
        <ArticleRow key={item.id} item={item} slug={slug} />
      ))}
    </ul>
  );
}
