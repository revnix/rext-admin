"use client";

import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { RunProgress } from "@/components/generate-content/run-progress";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { authenticatedFetch } from "@/lib/auth-utils";
import { isActiveGenerationJob } from "@/lib/generate-content/active-generation";
import {
  announceBackgroundGenerationRemoval,
  BACKGROUND_GENERATION_REMOVAL_STORAGE_KEY,
  requestBackgroundGenerationRestore,
} from "@/lib/generate-content/background-generation-sync";
import { describeFailedJob } from "@/lib/generate-content/background-progress";
import { stagesAt } from "@/lib/generate-content/run-stages";
import { workspaceRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useWorkspaceOptional } from "@/providers/workspace-provider";
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
  awaitingInput?: boolean;
  runStage?: BackgroundGenerationJob["runStage"];
};

const isPending = (job: BackgroundGenerationJob) =>
  job.status === "queued" || job.status === "running";

const RUN_DISCOVERY_GRACE_MS = 15_000;

export function BackgroundGenerationDock() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The thread actually open on screen, if any. `?thread=` is the only
  // thing that identifies WHICH generation is being viewed — the pathname
  // is the same for every one of them.
  const openThreadId = searchParams.get("thread");
  const workspaceContext = useWorkspaceOptional();
  const storedWorkspaceSlug = useCurrentWorkspaceSlug();
  const workspaceSlug =
    workspaceContext?.workspaceSlug || storedWorkspaceSlug || null;
  const [isMounted, setIsMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showStages, setShowStages] = useState(false);
  const jobs = useBackgroundGenerationStore((state) => state.jobs);
  const updateJob = useBackgroundGenerationStore((state) => state.updateJob);
  const removeJob = useBackgroundGenerationStore((state) => state.removeJob);
  const mergeJobs = useBackgroundGenerationStore((state) => state.mergeJobs);

  const dismissJob = useCallback(
    (job: BackgroundGenerationJob) => {
      removeJob(job.threadId);
      announceBackgroundGenerationRemoval([job.threadId]);
    },
    [removeJob],
  );

  const openJob = useCallback(
    (job: BackgroundGenerationJob) => {
      requestBackgroundGenerationRestore(job.threadId);
      router.push(job.resultUrl as Route);
      if (job.status === "completed" && job.awaitingInput !== true) {
        dismissJob(job);
      }
    },
    [dismissJob, router],
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      if (
        event.key === BACKGROUND_GENERATION_REMOVAL_STORAGE_KEY &&
        event.newValue
      ) {
        try {
          const removal = JSON.parse(event.newValue) as {
            threadIds?: string[];
            redirectUrl?: string;
          };
          for (const threadId of removal.threadIds ?? []) {
            removeJob(threadId);
          }
          const currentThreadId = new URLSearchParams(
            window.location.search,
          ).get("thread");
          if (
            removal.redirectUrl &&
            currentThreadId &&
            removal.threadIds?.includes(currentThreadId)
          ) {
            router.replace(removal.redirectUrl as Route);
          }
        } catch {
          // A malformed removal event should not affect the current session.
        }
        return;
      }

      if (event.key !== BACKGROUND_GENERATION_STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        const persisted = JSON.parse(event.newValue) as {
          state?: { jobs?: BackgroundGenerationJob[] };
        };
        if (persisted.state?.jobs) {
          const currentByThread = new Map(
            useBackgroundGenerationStore
              .getState()
              .jobs.map((job) => [job.threadId, job]),
          );
          const terminalUpdates = persisted.state.jobs.filter((incoming) => {
            if (
              incoming.status !== "completed" &&
              incoming.status !== "failed"
            ) {
              return false;
            }

            const current = currentByThread.get(incoming.threadId);
            if (
              current &&
              new Date(incoming.updatedAt).getTime() <
                new Date(current.updatedAt).getTime()
            ) {
              return false;
            }
            return (
              !current ||
              current.status !== incoming.status ||
              current.awaitingInput !== incoming.awaitingInput ||
              current.progress !== incoming.progress ||
              current.stage !== incoming.stage ||
              current.error !== incoming.error
            );
          });

          mergeJobs(persisted.state.jobs);
          for (const job of terminalUpdates) {
            requestBackgroundGenerationRestore(job.threadId);
          }
        }
      } catch {
        // A malformed storage event should not affect the current session.
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [mergeJobs, removeJob, router]);

  useEffect(() => {
    if (!isMounted || !pollingKey) return;

    let disposed = false;

    const checkJobs = async () => {
      const pendingJobs = useBackgroundGenerationStore
        .getState()
        .jobs.filter(isPending);

      await Promise.all(
        pendingJobs.map(async (job) => {
          if (
            !job.runId &&
            Date.now() - new Date(job.updatedAt).getTime() <
              RUN_DISCOVERY_GRACE_MS
          ) {
            return;
          }

          const runParam = job.runId
            ? `?runId=${encodeURIComponent(job.runId)}`
            : "";

          try {
            const response = await authenticatedFetch(
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
                runStage: undefined,
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
              const nextRunStage = payload.runStage ?? latestJob.runStage;
              // A new stage starts its clock now; the same one keeps its start.
              const stageChanged =
                nextRunStage?.phase !== latestJob.runStage?.phase ||
                nextRunStage?.id !== latestJob.runStage?.id;
              if (
                latestJob.runId === payload.run.id &&
                latestJob.status === nextStatus &&
                latestJob.stage === nextStage &&
                latestJob.progress === nextProgress &&
                !stageChanged
              ) {
                return;
              }
              updateJob(job.threadId, {
                runId: payload.run.id,
                status: nextStatus,
                stage: nextStage,
                progress: nextProgress,
                runStage: nextRunStage,
                ...(stageChanged && {
                  stageStartedAt: new Date().toISOString(),
                }),
              });
              return;
            }

            if (payload.run.status === "success") {
              // A run that paused on an interrupt also reports "success", so the
              // derived stage/progress decide whether this is a finished article
              // or an interactive step waiting on the user.
              updateJob(job.threadId, {
                runId: payload.run.id,
                status: "completed",
                runStage: undefined,
                stage: payload.stage ?? "Article ready",
                progress: Math.max(latestJob.progress, payload.progress ?? 100),
                awaitingInput: payload.awaitingInput === true,
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
                runStage: undefined,
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
  }, [isMounted, pollingKey, updateJob]);

  useEffect(() => {
    const unnotified = jobs.filter(
      (job) =>
        (job.status === "completed" || job.status === "failed") &&
        !job.completionNotified,
    );

    for (const job of unnotified) {
      // Notification bookkeeping must not make an old paused run look newer
      // than a resume that has already started in another tab.
      updateJob(job.threadId, {
        completionNotified: true,
        updatedAt: job.updatedAt,
      });
      const completed = job.status === "completed";
      const awaiting = completed && job.awaitingInput === true;
      useNotificationStore.getState().addNotification({
        // A thread notifies once per milestone (keywords ready, topics ready,
        // article ready), so the id is scoped by stage to avoid deduplication.
        id: completed
          ? `content-generation-${job.threadId}-${job.progress}`
          : `content-generation-failed-${job.threadId}`,
        operationId: job.threadId,
        title: completed
          ? awaiting
            ? job.stage
            : "Article ready"
          : describeFailedJob(job).title,
        message: completed
          ? awaiting
            ? `"${job.title}" is ready for your next step.`
            : `"${job.title}" has finished generating.`
          : describeFailedJob(job).description,
        type: completed ? "success" : "error",
        createdAt: new Date().toISOString(),
        read: false,
        metadata: {
          href: job.resultUrl,
          threadId: job.threadId,
          kind: "content_generation",
        },
      });

      if (awaiting) {
        toast.info(job.stage, {
          description: job.title,
          action: {
            label: "Continue",
            onClick: () => openJob(job),
          },
        });
      } else if (completed) {
        toast.success("Your article is ready", {
          description: job.title,
          action: {
            label: "Open article",
            onClick: () => openJob(job),
          },
        });
      } else {
        const failure = describeFailedJob(job);
        toast.error(failure.title, {
          description: failure.description,
          action: {
            label: "View details",
            onClick: () => openJob(job),
          },
        });
      }
    }
  }, [jobs, openJob, updateJob]);

  const cancelJob = async (target: BackgroundGenerationJob) => {
    try {
      const response = await authenticatedFetch(
        `/api/generate/${encodeURIComponent(target.threadId)}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId: target.runId }),
        },
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Unable to cancel this generation");
      }
      // The run is stopped server-side; drop the record so nothing keeps
      // polling or notifying for work that will never finish.
      const freshGenerationUrl = workspaceRoutes.generate_content(
        target.workspaceSlug,
      );
      // Only navigate if the cancelled job is the one actually on screen.
      // Cancelling a background job from the list must leave the current page
      // alone — redirecting unconditionally was fine when only one generation
      // could exist at a time, but now it yanks the user out of unrelated work.
      const isViewingTarget = openThreadId === target.threadId;

      removeJob(target.threadId);
      announceBackgroundGenerationRemoval(
        [target.threadId],
        isViewingTarget ? { redirectUrl: freshGenerationUrl } : {},
      );
      if (isViewingTarget) {
        router.replace(freshGenerationUrl as Route);
      }
      toast.success("Generation cancelled", { description: target.title });
    } catch (error) {
      toast.error("Could not cancel this generation", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const isViewingGenerationThread =
    (pathname?.endsWith("/generate_content") ?? false) && Boolean(openThreadId);

  const displayedJobs = isViewingGenerationThread
    ? visibleJobs.filter((job) => job.threadId !== openThreadId)
    : visibleJobs;

  if (!isMounted || displayedJobs.length === 0) return null;

  const job = displayedJobs.find(isPending) ?? displayedJobs[0];
  const otherJobs = displayedJobs.filter(
    (item) => item.threadId !== job.threadId,
  );
  const pending = isPending(job);
  const completed = job.status === "completed";
  const awaitingInput = completed && job.awaitingInput === true;
  // A run paused on an interrupt reads as `completed`, but the article is not
  // finished — the thread is still live and still blocks new generations. The
  // X must end it server-side, not just hide the dock. Only a genuinely
  // finished (or failed) job is safe to merely dismiss.
  const canCancel = isActiveGenerationJob(job);
  // Don't show the navigation button when the user is already on THIS job's
  // page, to avoid duplicating the page's own Continue/action button.
  //
  // This must compare the thread, not the path. Every generation lives at the
  // same `/generate_content` route, so a path-prefix check also matched the
  // blank selection page — which hid Continue for a job that was waiting on the
  // user, leaving no way back into it.
  const isOnResultPage = openThreadId === job.threadId;
  // The run component, for a run the poll has placed in a stage; other jobs keep their sentence.
  const runStages =
    pending && job.runStage
      ? stagesAt(
          job.runStage.phase,
          job.runStage.id,
          job.stageStartedAt ? Date.parse(job.stageStartedAt) : undefined,
        )
      : null;

  return (
    <section
      aria-label="Background generation activity"
      className="sticky bottom-(--bottom-bar-height) z-(--z-sticky) border-t border-border bg-surface-raised lg:bottom-0"
    >
      <div className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 md:px-6">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center",
            pending && "text-foreground",
            completed && "text-success-600",
            job.status === "failed" && "text-danger-600",
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

        <div className="min-w-0 flex-1 basis-56">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-body font-medium text-foreground">
              {job.title}
            </p>
            {otherJobs.length > 0 && (
              // Multiple generations can now run at once, so this has to be a
              // real control: as static text there was no way to reach the
              // other jobs at all.
              <button
                type="button"
                onClick={() => setExpanded((open) => !open)}
                aria-expanded={expanded}
                aria-controls="background-generation-others"
                className="num shrink-0 rounded-sm text-caption text-muted-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                +{otherJobs.length} more
              </button>
            )}
          </div>
          {runStages ? (
            <RunProgress
              variant="compact"
              stages={runStages}
              className="mt-1 max-w-sm"
            />
          ) : (
            <p
              role="status"
              aria-live="polite"
              className={cn(
                "truncate text-caption text-muted-foreground",
                job.status === "failed" && "text-danger-600",
              )}
            >
              {job.error ?? (pending ? `${job.stage}…` : job.stage)}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {runStages && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              aria-expanded={showStages}
              aria-controls="background-generation-stages"
              onClick={() => setShowStages((open) => !open)}
            >
              {showStages ? "Hide steps" : "Steps"}
            </Button>
          )}
          {!isOnResultPage && (
            <Button
              type="button"
              variant={completed ? "default" : "outline"}
              size="sm"
              className="h-8 whitespace-nowrap"
              onClick={() => openJob(job)}
            >
              {awaitingInput
                ? "Continue"
                : completed
                  ? "Open article"
                  : pending
                    ? "View progress"
                    : "View details"}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          )}
          {canCancel ? (
            <ConfirmationDialog
              title="Cancel this generation?"
              description={`"${job.title}" will stop where it is. Credits already spent on the finished steps are not refunded.`}
              confirmText="Cancel generation"
              cancelText="Keep generating"
              variant="destructive"
              onConfirm={() => void cancelJob(job)}
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                aria-label={`Cancel ${job.title}`}
              >
                <span>Cancel</span>
                <X className="h-4 w-4" />
              </Button>
            </ConfirmationDialog>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              aria-label={`Dismiss ${job.title}`}
              onClick={() => dismissJob(job)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {showStages && runStages && (
        <div
          id="background-generation-stages"
          className="border-t border-border px-4 py-3 md:px-6"
        >
          <RunProgress stages={runStages} className="max-w-md" />
        </div>
      )}

      {expanded && otherJobs.length > 0 && (
        <ul
          id="background-generation-others"
          className="max-h-48 divide-y divide-border overflow-y-auto border-t border-border px-4 md:px-6"
        >
          {otherJobs.map((other) => (
            <li
              key={other.threadId}
              className="flex items-center gap-3 py-2 text-body"
            >
              {isPending(other) ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-foreground motion-reduce:animate-none" />
              ) : other.status === "completed" ? (
                <CheckCircle2 className="size-4 shrink-0 text-success-600" />
              ) : (
                <AlertCircle className="size-4 shrink-0 text-danger-600" />
              )}
              <span className="min-w-0 flex-1 truncate">{other.title}</span>
              {/* Fixed-width slot so rows stay column-aligned whether or not
                  this generation is still running. */}
              <span
                className={cn(
                  "hidden w-40 shrink-0 truncate text-caption text-muted-foreground sm:block",
                  other.status === "failed" && "text-danger-600",
                )}
              >
                {other.error ?? other.stage}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0"
                onClick={() => openJob(other)}
              >
                {other.status === "completed" && other.awaitingInput
                  ? "Continue"
                  : "Open"}
                <ArrowUpRight className="h-3 w-3" />
              </Button>

              {/* Close this one generation, not the whole dock. A still-live
                  run has to be stopped server-side rather than merely hidden:
                  hiding it would leave the thread running and still spending
                  credits with nothing left tracking it. */}
              {isActiveGenerationJob(other) ? (
                <ConfirmationDialog
                  title="Cancel this generation?"
                  description={`"${other.title}" will stop where it is. Credits already spent on the finished steps are not refunded.`}
                  confirmText="Cancel generation"
                  cancelText="Keep generating"
                  variant="destructive"
                  onConfirm={() => void cancelJob(other)}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground"
                    aria-label={`Cancel ${other.title}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </ConfirmationDialog>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground"
                  aria-label={`Dismiss ${other.title}`}
                  onClick={() => dismissJob(other)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
