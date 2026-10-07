"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { ContentHealthCard } from "@/components/home/content-health-card";
import { ContinueRow } from "@/components/home/continue-row";
import { CreditsCard } from "@/components/home/credits-card";
import { HomeChecklist } from "@/components/home/home-checklist";
import { PaywallCard } from "@/components/home/paywall-card";
import {
  articlesToContinue,
  checklistSteps,
  contentHealth,
  countPipeline,
  hasWrittenArticle,
  recentPublishes,
  suggestKeywords,
  type ChecklistFacts,
} from "@/components/home/home-data";
import { PipelineCounts } from "@/components/home/pipeline-counts";
import { PublishingCard } from "@/components/home/publishing-card";
import { SearchConsoleCard } from "@/components/home/search-console-card";
import { SuggestedKeywords } from "@/components/home/suggested-keywords";
import { DetailPage, PageSkeleton } from "@/components/layouts";
import { SettingsGroup } from "@/components/settings/settings-group";
import { useResourceLimit } from "@/components/subscription/usage-limit-warning";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useChecklistAnalytics } from "@/hooks/use-checklist-analytics";
import { useAllContent } from "@/hooks/use-content";
import { useIntegrations } from "@/hooks/use-integrations";
import { usePageTitle } from "@/hooks/use-page-title";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { useWorkspaceAutoSelect } from "@/hooks/use-workspace-auto-select";
import { isActiveGenerationJob } from "@/lib/generate-content/active-generation";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { libraryQueries, workspaceQueries } from "@/lib/query-keys";
import { workspaceRoutes } from "@/lib/routes";
import { getWorkspaceDisplayTitle } from "@/lib/workspace";
import { useBackgroundGenerationStore } from "@/stores/background-generation-store";

/** The Continue row shows this many runs and articles at most. */
const CONTINUE_LIMIT = 5;
/** Suggested keywords: three to five. */
const SUGGESTION_LIMIT = 5;

/**
 * The workspace's home (plans/app/D-pages.md §2.1): what to do next, not totals. Getting started
 * until its five steps are done; Continue (runs still going, articles in review, drafts); the
 * pipeline counts; keywords researched but not written yet. Beside them, the credits and the
 * Search Console slot.
 */
export default function HomePage() {
  const {
    workspace,
    isLoading: isLoadingWorkspaces,
    hasWorkspaces,
  } = useWorkspaceAutoSelect();
  const router = useRouter();
  const { user } = useAuthSession();
  const { isLimitReached, isLoading: isLimitLoading } =
    useResourceLimit("workspaces");

  // No workspace yet: create one.
  useEffect(() => {
    if (
      !isLoadingWorkspaces &&
      !hasWorkspaces &&
      !isLimitReached &&
      !isLimitLoading
    ) {
      router.push("/w/create" as Route);
    }
  }, [
    isLoadingWorkspaces,
    hasWorkspaces,
    isLimitReached,
    isLimitLoading,
    router,
  ]);

  const workspaceId = workspace?.id ?? "";
  const slug = workspace?.slug ?? "";
  const content = useAllContent(workspaceId);
  // Generation is offered only to someone who may generate, as on Generate (the backend refuses the run).
  const { hasPermission: canGenerate } = useWorkspacePermission(
    CONTENT_PERMISSIONS.CREATE,
    workspaceId,
  );
  const sites = useIntegrations(workspaceId || null);
  const brandVoice = useQuery(workspaceQueries.brandVoice(workspaceId));
  const library = useQuery(libraryQueries.list(workspaceId, user?.id ?? ""));
  const jobs = useBackgroundGenerationStore((state) => state.jobs);

  const now = useMemo(() => new Date(), []);
  const articles = content.data;
  const counts = useMemo(
    () => (articles ? countPipeline(articles, now) : null),
    [articles, now],
  );
  const runs = useMemo(
    () =>
      jobs
        .filter(
          (job) => job.workspaceSlug === slug && isActiveGenerationJob(job),
        )
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
        .slice(0, CONTINUE_LIMIT),
    [jobs, slug],
  );
  const toContinue = useMemo(
    () =>
      articles
        ? articlesToContinue(
            articles,
            Math.max(0, CONTINUE_LIMIT - runs.length),
          )
        : [],
    [articles, runs.length],
  );
  const suggestions = useMemo(
    () =>
      library.data && articles
        ? suggestKeywords(
            library.data,
            articles,
            SUGGESTION_LIMIT,
            runs.map((job) => job.keyword),
          )
        : [],
    [library.data, articles, runs],
  );

  // A step whose data didn't come (still loading, or hidden from the person's role) is left out.
  const facts: ChecklistFacts = {
    site: sites.isSuccess
      ? sites.data.some((site) => site.is_active)
      : undefined,
    "brand-voice": brandVoice.isSuccess
      ? Boolean(
          brandVoice.data?.brand_voice?.about?.trim() ||
            brandVoice.data?.brand_voice?.brand_name?.trim(),
        )
      : undefined,
    keyword: library.isSuccess ? library.data.length > 0 : undefined,
    content: articles ? hasWrittenArticle(articles) : undefined,
    publish: articles
      ? articles.some((item) =>
          ["published", "scheduled"].includes(String(item.status)),
        )
      : undefined,
  };
  const settled = [sites, brandVoice, library, content].every(
    (query) => !query.isPending || query.fetchStatus === "idle",
  );
  const steps = checklistSteps(facts);
  const showChecklist =
    settled && steps.length > 0 && steps.some((step) => !step.done);
  useChecklistAnalytics(workspaceId || undefined, user?.id, steps, settled);

  usePageTitle(
    workspace ? `${getWorkspaceDisplayTitle(workspace)} - Home` : "Home",
    "What to do next in this workspace.",
  );

  if (isLoadingWorkspaces) {
    return <PageSkeleton layout="detail" label="Loading your workspace..." />;
  }
  // About to go to workspace creation: render nothing rather than a flash of an empty home.
  if (!hasWorkspaces || !workspace) {
    return null;
  }

  const generate = workspaceRoutes.generate_content(slug);
  const libraryHref = workspaceRoutes.content(slug);

  return (
    <AuthGuard>
      <ErrorBoundary framed>
        <DetailPage
          title={getWorkspaceDisplayTitle(workspace, "Home")}
          description="What to do next in this workspace."
          actions={
            canGenerate ? (
              <Button asChild>
                <Link href={generate as Route}>
                  <Plus aria-hidden />
                  Start an article
                </Link>
              </Button>
            ) : undefined
          }
          aside={
            <div className="flex flex-col gap-4">
              <CreditsCard workspaceId={workspaceId} />
              <SearchConsoleCard />
            </div>
          }
        >
          <div className="flex flex-col gap-10">
            <PaywallCard workspaceId={workspaceId} />
            {showChecklist && (
              <SettingsGroup
                title="Get started"
                description="Five steps to your first published article."
              >
                <HomeChecklist
                  steps={steps}
                  hrefs={{
                    site: workspaceRoutes.integrations(slug),
                    "brand-voice": workspaceRoutes.settings.brandVoice(slug),
                    // Generation's steps link only for someone who may generate.
                    ...(canGenerate
                      ? { keyword: generate, content: generate }
                      : {}),
                    publish: `${libraryHref}?status=draft,ready`,
                  }}
                />
              </SettingsGroup>
            )}
            <SettingsGroup title="Continue">
              {articles ? (
                <ContinueRow
                  slug={slug}
                  runs={runs}
                  articles={toContinue}
                  canGenerate={canGenerate}
                />
              ) : content.isError ? (
                <Notice
                  tone="danger"
                  title="Your articles didn't load"
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => content.refetch()}
                      disabled={content.isFetching}
                    >
                      Try again
                    </Button>
                  }
                >
                  The pipeline counts wait for them too.
                </Notice>
              ) : (
                <Skeleton className="h-32 w-full" />
              )}
            </SettingsGroup>
            <SettingsGroup title="Pipeline">
              <PipelineCounts
                slug={slug}
                counts={counts}
                failed={content.isError}
              />
            </SettingsGroup>
            {articles && (
              <SettingsGroup title="Performance">
                <div className="grid gap-4 md:grid-cols-2">
                  <ContentHealthCard
                    health={contentHealth(articles, new Date())}
                    libraryHref={libraryHref}
                  />
                  <PublishingCard slug={slug} {...recentPublishes(articles)} />
                </div>
              </SettingsGroup>
            )}
            {suggestions.length > 0 && (
              <SettingsGroup
                title="Suggested keywords"
                description="Keywords you've researched that no article covers yet."
              >
                <SuggestedKeywords
                  slug={slug}
                  entries={suggestions}
                  canGenerate={canGenerate}
                />
              </SettingsGroup>
            )}
          </div>
        </DetailPage>
      </ErrorBoundary>
    </AuthGuard>
  );
}
