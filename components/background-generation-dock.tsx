"use client";

import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  BACKGROUND_GENERATION_STORAGE_KEY,
  type BackgroundGenerationJob,
  useBackgroundGenerationStore,
} from "@/stores/background-generation-store";
import { useNotificationStore } from "@/stores/notification-store";
import { useCurrentWorkspaceSlug } from "@/stores/workspace";
import type { Route } from "next";

type GenerationStatusResponse = {
  run: {
    id: string;
    status:
      | "pending"
      | "running"
      | "error"
      | "success"
      | "timeout"
      | "interrupted";
    updatedAt: string;
  } | null;
  progress?: number;
  stage?: string;
  error?: string;
};

const isPending = (job: BackgroundGenerationJob) =>
  job.status === "queued" || job.status === "running";

const RUN_DISCOVERY_GRACE_MS = 15_000;

export function BackgroundGenerationDock() {
  const router = useRouter();
  const workspaceSlug = useCurrentWorkspaceSlug();
  const jobs = useBackgroundGenerationStore((state) => state.jobs);
  const hasHydrated = useBackgroundGenerationStore(
    (state) => state.hasHydrated,
  );
  const updateJob = useBackgroundGenerationStore((state) => state.updateJob);
  const removeJob = useBackgroundGenerationStore((state) => state.removeJob);
  const mergeJobs = useBackgroundGenerationStore((state) => state.mergeJobs);

  const visibleJobs = useMemo(
    () =>
      jobs.filter(
        (job) => !workspaceSlug || job.workspaceSlug === workspaceSlug,
      ),
    [jobs, workspaceSlug],
  );

  const pollingKey = useMemo(
    () =>
      jobs
        .filter(isPending)
        .map((job) => `${job.threadId}:${job.runId ?? ""}`)
        .join("|"),
    [jobs],
  );

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== BACKGROUND_GENERATION_STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        const persisted = JSON.parse(event.newValue) as {
          state?: { jobs?: BackgroundGenerationJob[] };
        };
        if (persisted.state?.jobs) {
          mergeJobs(persisted.state.jobs);
        }
      } catch {
        // A malformed storage event should not affect the current session.
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [mergeJobs]);

  useEffect(() => {
    if (!hasHydrated || !pollingKey) return;

    let disposed = false;

    const checkJobs = async () => {
      const pendingJobs = useBackgroundGenerationStore
        .getState()
        .jobs.filter(isPending);

      await Promise.all(
        pendingJobs.map(async (job) => {
          if (
            !job.runId &&
            Date.now() - new Date(job.createdAt).getTime() <
              RUN_DISCOVERY_GRACE_MS
          ) {
            return;
          }

          const runParam = job.runId
            ? `?runId=${encodeURIComponent(job.runId)}`
            : "";

          try {
            const response = await fetch(
              `/api/generate/${encodeURIComponent(job.threadId)}/status${runParam}`,
              { cache: "no-store" },
            );
            if (!response.ok && response.status !== 202) return;

            const payload = (await response.json()) as GenerationStatusResponse;
            if (disposed || !payload.run) return;

            const latestJob = useBackgroundGenerationStore
              .getState()
              .jobs.find((item) => item.threadId === job.threadId);
            if (!latestJob) return;

            if (payload.error) {
              updateJob(job.threadId, {
                runId: payload.run.id,
                status: "failed",
                stage: payload.stage ?? "Generation failed",
                progress: 100,
                error: payload.error,
                updatedAt: payload.run.updatedAt,
              });
              return;
            }

            if (
              payload.run.status === "pending" ||
              payload.run.status === "running"
            ) {
              const nextStage = payload.stage ?? latestJob.stage;
              const nextProgress = Math.max(
                latestJob.progress,
                payload.progress ?? 8,
              );
              const nextStatus =
                payload.run.status === "pending" ? "queued" : "running";
              if (
                latestJob.runId === payload.run.id &&
                latestJob.status === nextStatus &&
                latestJob.stage === nextStage &&
                latestJob.progress === nextProgress
              ) {
                return;
              }
              updateJob(job.threadId, {
                runId: payload.run.id,
                status: nextStatus,
                stage: nextStage,
                progress: nextProgress,
              });
              return;
            }

            if (payload.run.status === "success") {
              updateJob(job.threadId, {
                runId: payload.run.id,
                status: "completed",
                stage: "Article ready",
                progress: 100,
                updatedAt: payload.run.updatedAt,
              });
              return;
            }

            if (
              payload.run.status === "error" ||
              payload.run.status === "timeout" ||
              payload.run.status === "interrupted"
            ) {
              updateJob(job.threadId, {
                runId: payload.run.id,
                status: "failed",
                stage: payload.stage ?? "Generation failed",
                progress: 100,
                error:
                  payload.error ??
                  "We could not finish this article. Open it to try again.",
                updatedAt: payload.run.updatedAt,
              });
            }
          } catch {
            // Keep the last known state. The next poll will retry.
          }
        }),
      );
    };

    void checkJobs();
    const intervalId = window.setInterval(checkJobs, 4000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void checkJobs();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [hasHydrated, pollingKey, updateJob]);

  useEffect(() => {
    const unnotified = jobs.filter(
      (job) =>
        (job.status === "completed" || job.status === "failed") &&
        !job.completionNotified,
    );

    for (const job of unnotified) {
      updateJob(job.threadId, { completionNotified: true });
      const completed = job.status === "completed";
      useNotificationStore.getState().addNotification({
        id: completed
          ? `content-generation-${job.threadId}`
          : `content-generation-failed-${job.threadId}`,
        operationId: job.threadId,
        title: completed ? "Article ready" : "Article generation failed",
        message: completed
          ? `"${job.title}" has finished generating.`
          : `"${job.title}" could not be completed.`,
        type: completed ? "success" : "error",
        createdAt: new Date().toISOString(),
        read: false,
        metadata: {
          href: job.resultUrl,
          threadId: job.threadId,
          kind: "content_generation",
        },
      });

      if (completed) {
        toast.success("Your article is ready", {
          description: job.title,
          action: {
            label: "Open article",
            onClick: () => router.push(job.resultUrl as Route),
          },
        });
      } else {
        toast.error("Article generation failed", {
          description: job.title,
          action: {
            label: "View details",
            onClick: () => router.push(job.resultUrl as Route),
          },
        });
      }
    }
  }, [jobs, router, updateJob]);

  if (!hasHydrated || visibleJobs.length === 0) return null;

  const activeCount = visibleJobs.filter(isPending).length;
  const job = visibleJobs.find(isPending) ?? visibleJobs[0];
  const pending = isPending(job);
  const completed = job.status === "completed";

  return (
    <section
      aria-label="Background generation activity"
      className={cn(
        "relative border-b border-border bg-background",
        pending && "bg-primary/[0.035]",
        completed && "bg-emerald-500/[0.045]",
        job.status === "failed" && "bg-destructive/[0.035]",
      )}
    >
      <div className="flex min-h-14 flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 lg:px-6">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            pending && "bg-primary/10 text-primary",
            completed &&
              "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
            job.status === "failed" && "bg-destructive/10 text-destructive",
          )}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
          ) : completed ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
        </div>

        <FileText className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />

        <div className="min-w-0 flex-1 basis-[220px]">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {job.title}
            </p>
            {activeCount > 1 && (
              <span className="shrink-0 text-xs text-muted-foreground">
                +{activeCount - 1} more
              </span>
            )}
          </div>
          <p
            role="status"
            aria-live="polite"
            className={cn(
              "truncate text-xs text-muted-foreground",
              job.status === "failed" && "text-destructive",
            )}
          >
            {job.error ?? job.stage}
          </p>
        </div>

        {pending && (
          <div className="flex min-w-[170px] flex-1 basis-[220px] items-center gap-3 sm:max-w-sm">
            <Progress
              value={job.progress}
              className="h-1.5 flex-1 bg-muted"
              aria-label={`${job.title} generation progress`}
            />
            <span className="w-10 text-right text-sm font-semibold tabular-nums text-foreground">
              {job.progress}%
            </span>
          </div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant={completed ? "default" : "outline"}
            size="sm"
            className="h-8 whitespace-nowrap"
            onClick={() => router.push(job.resultUrl as Route)}
          >
            {completed
              ? "Open article"
              : pending
                ? "View progress"
                : "View details"}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>

          {!pending && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              aria-label={`Dismiss ${job.title}`}
              onClick={() => removeJob(job.threadId)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
