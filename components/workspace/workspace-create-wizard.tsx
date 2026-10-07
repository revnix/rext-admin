"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FieldController } from "@/components/forms/field-controller";
import { FormShell } from "@/components/forms/form-shell";
import { useZodForm } from "@/components/forms/use-zod-form";
import { RunProgress } from "@/components/generate-content/run-progress";
import { useCheckLimit } from "@/components/subscription/limit-check-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { useSSEChannel } from "@/hooks/use-sse-channel";
import {
  useRetryWorkspacePipeline,
  useWorkspacePipeline,
} from "@/hooks/use-workspace-pipeline";
import { analytics } from "@/lib/analytics";
import { ApiError } from "@/lib/api-client/core";
import { log } from "@/lib/logger";
import { subscriptionQueries, workspaceQueries } from "@/lib/query-keys";
import {
  businessRuleOf,
  PIPELINE_NOT_RETRYABLE_RULE,
  PIPELINE_RUNNING_RULE,
  pipelineOutcome,
  stoppedRunCopy,
} from "@/lib/workspace/workspace-pipeline";
import {
  findFailedEvent,
  workspaceRunStages,
} from "@/lib/workspace/workspace-run-stages";
import { useSSE } from "@/providers/sse-provider";
import {
  type WorkspaceFormData,
  workspaceFormSchema,
} from "@/schemas/workspace-schemas";
import { useWorkspaceCrudStore, useWorkspaceStore } from "@/stores/workspace";
import type { Route } from "next";

/**
 * Creating a workspace (plans/app/D-pages.md §2.9): a name and the website, then the backend's
 * analysis as the run component, fed by the operation's events. When it completes, the new
 * workspace opens on its Brand voice section with the draft to review: the analysis has already
 * saved the brand voice, the personas and the competitors. While the analysis runs, the workspace's
 * pipeline record is read too (G20): the run lives in the API process, so a restart or a deploy can
 * end it without a word on the stream. A run that failed or was interrupted says so and offers
 * "Read the website again" (the backend's retry, then its new operation is followed); one the record
 * shows completed goes on as if the stream had said so; a stream that stops while the run is still
 * going (or for a backend without the record) offers to reconnect. A workspace past
 * the plan's limit (the backend's 429, or a limit the page learns of after it loaded) gets a
 * notice with the way to a bigger plan, never a click that does nothing.
 */
export function WorkspaceCreateWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearCompletedOperation } = useSSE();
  const { checkLimit, canCreate, isLimitReached } = useCheckLimit("workspaces");

  const [operationId, setOperationId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [website, setWebsite] = useState("");
  const [streamProblem, setStreamProblem] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const slugRef = useRef<string | null>(null);
  // The stream and the pipeline record can both report the end: the first one wins.
  const completedRef = useRef(false);

  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);
  const workspaceList = useWorkspaceStore((state) => state.workspaceList);
  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace,
  );

  const form = useZodForm(workspaceFormSchema, {
    defaultValues: {
      name: "",
      url: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const openBrandVoice = useCallback(
    (drafted: boolean) => {
      const slug = slugRef.current;
      if (!slug) return;
      queryClient.invalidateQueries({ queryKey: workspaceQueries.all() });
      router.push(
        `/w/${slug}/settings/brand-voice${drafted ? "?drafted=1" : ""}` as Route,
      );
    },
    [queryClient, router],
  );

  const handleComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    toast.success("Your workspace is ready");
    openBrandVoice(true);
  }, [openBrandVoice]);

  // A failed step arrives as an event (shown from `events`); anything else here is the stream itself.
  const handleError = useCallback((error: string) => {
    log.error("[Workspace create] The analysis stream stopped", error);
    setStreamProblem(error);
  }, []);

  const { events, connect, disconnect } = useSSEChannel(operationId, {
    onComplete: handleComplete,
    onError: handleError,
    autoConnect: true,
  });

  useEffect(() => {
    return () => {
      if (operationId) {
        disconnect();
        clearCompletedOperation(operationId);
      }
    };
  }, [operationId, disconnect, clearCompletedOperation]);

  // The run's record, read every few seconds while it's followed.
  const { data: pipeline, refetch: readPipeline } = useWorkspacePipeline(
    workspaceId,
    { poll: Boolean(operationId) },
  );
  // A record of another run: one that's going replaced ours (another tab read the website again),
  // so it's followed; one that completed drafted the brand voice. A stopped one is ours, read
  // before the retry's record came back, and says nothing.
  const outcome =
    pipeline?.status === "completed"
      ? "completed"
      : pipelineOutcome(pipeline, operationId);
  const replacement =
    pipeline?.status === "running" &&
    pipeline.operation_id &&
    pipeline.operation_id !== operationId
      ? pipeline.operation_id
      : null;
  useEffect(() => {
    if (operationId && outcome === "completed") handleComplete();
  }, [operationId, outcome, handleComplete]);
  useEffect(() => {
    if (!operationId || !replacement) return;
    setStreamProblem(null);
    setOperationId(replacement);
  }, [operationId, replacement]);

  const retry = useRetryWorkspacePipeline();
  const readWebsiteAgain = async () => {
    if (!workspaceId) return;
    try {
      const next = await retry.mutateAsync(workspaceId);
      setStreamProblem(null);
      setOperationId(next);
      void readPipeline();
    } catch (error) {
      const rule = businessRuleOf(error);
      if (rule === PIPELINE_RUNNING_RULE) {
        // Another tab or a refresh started it again: follow that run.
        const { data } = await readPipeline();
        if (data?.operation_id) {
          setStreamProblem(null);
          setOperationId(data.operation_id);
        }
        return;
      }
      if (rule === PIPELINE_NOT_RETRYABLE_RULE) {
        // The run completed after all, so the brand voice is drafted.
        handleComplete();
        return;
      }
      log.error("[Workspace create] Reading the website again failed", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Reading the website again couldn't start. Try again.",
      );
    }
  };

  const handleSubmit = async (data: WorkspaceFormData) => {
    if (isLimitReached) {
      setLimitReached(true);
      return;
    }
    if (!canCreate || !checkLimit("create a workspace")) {
      return;
    }
    setLimitReached(false);
    // Before creation: the list doesn't hold the new workspace yet.
    const isFirstWorkspace = workspaceList.length === 0;
    try {
      const workspace = await createWorkspace({
        name: data.name,
        url: data.url,
        timezone: data.timezone,
      });
      slugRef.current = workspace.slug;
      setWorkspaceId(workspace.id);
      // The switcher's list stays cached for minutes; the sidebar needs the new workspace now.
      setCurrentWorkspace(workspace);
      queryClient.invalidateQueries({ queryKey: workspaceQueries.all() });
      // The plan's count above the form ("1 of 1 workspace on your plan") counts this one now.
      queryClient.invalidateQueries({
        queryKey: subscriptionQueries.usage().queryKey,
      });
      analytics.track(
        isFirstWorkspace ? "onboarding_workspace_created" : "workspace_created",
        { workspace_id: workspace.id, workspace_slug: workspace.slug },
      );
      setWebsite(data.url);
      const operation = useWorkspaceCrudStore.getState().currentOperation;
      if (operation?.operationId) {
        setOperationId(operation.operationId);
      } else {
        // No analysis to follow: the workspace is there, its brand voice can be read later.
        openBrandVoice(false);
      }
    } catch (error) {
      log.error("[Workspace create] Failed to create the workspace", error);
      if (error instanceof ApiError && error.statusCode === 429) {
        // The plan's workspaces are all in use (another tab, or the plan changed): the count
        // above the form reads the usage again.
        setLimitReached(true);
        queryClient.invalidateQueries({
          queryKey: subscriptionQueries.usage().queryKey,
        });
        return;
      }
      // The backend checks the name and that the website answers: say so beside the field.
      const message = (error as Error).message;
      if (/website|url|domain/i.test(message)) {
        form.setError(
          "url",
          { type: "server", message },
          { shouldFocus: true },
        );
      } else if (/name/i.test(message)) {
        form.setError(
          "name",
          { type: "server", message },
          { shouldFocus: true },
        );
      } else {
        toast.error(message);
      }
    }
  };

  if (!operationId) {
    return (
      <div className="space-y-6">
        {limitReached && (
          <Notice
            tone="warning"
            title="Workspace limit reached"
            action={
              <Button asChild variant="outline" size="sm">
                <Link href={"/pricing" as Route}>View plans</Link>
              </Button>
            }
          >
            Every workspace on your plan is in use, so this one wasn't created.
            A bigger plan adds more.
          </Notice>
        )}
        <FormShell
          form={form}
          onSubmit={handleSubmit}
          submitLabel="Create workspace"
          cancel={{ onCancel: () => router.push("/") }}
        >
          <FieldController
            control={form.control}
            name="name"
            label="Workspace name"
            required
          >
            {(field) => (
              <Input {...field} maxLength={200} placeholder="e.g. My company" />
            )}
          </FieldController>
          <FieldController
            control={form.control}
            name="url"
            label="Website"
            description="We read it to draft the workspace's brand voice, personas and competitors."
            required
          >
            {(field) => (
              <Input
                {...field}
                type="url"
                inputMode="url"
                placeholder="https://your-company.com"
              />
            )}
          </FieldController>
        </FormShell>
      </div>
    );
  }

  const failed = findFailedEvent(events);
  // The stream's failure, or the record's: a run a restart ended reports nothing on the stream.
  const stopped =
    failed || outcome === "stopped"
      ? stoppedRunCopy(
          !failed && pipeline?.status === "interrupted"
            ? "interrupted"
            : "failed",
          { website, reason: failed?.message },
        )
      : null;
  return (
    <div className="space-y-4">
      <p className="text-body text-muted-foreground">
        Reading {website}. It usually takes one to two minutes. The workspace is
        already created, so you can leave this page.
      </p>
      <RunProgress stages={workspaceRunStages(events)} />
      {stopped ? (
        <Notice
          tone="danger"
          title={stopped.title}
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={readWebsiteAgain}
                disabled={retry.isPending}
              >
                {retry.isPending ? "Starting…" : "Read the website again"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openBrandVoice(false)}
              >
                Open the workspace
              </Button>
            </div>
          }
        >
          {stopped.body} Your workspace is created: read the website again to
          draft its brand voice, or open the workspace and do it later from its
          Brand voice settings.
        </Notice>
      ) : (
        streamProblem && (
          <Notice
            tone="warning"
            title="We lost touch with the analysis"
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setStreamProblem(null);
                  connect();
                }}
              >
                Retry
              </Button>
            }
          >
            It may still be running. Retry to reconnect, or{" "}
            <button
              type="button"
              className="font-medium underline underline-offset-4"
              onClick={() => openBrandVoice(false)}
            >
              open the workspace
            </button>
            .
          </Notice>
        )
      )}
    </div>
  );
}
