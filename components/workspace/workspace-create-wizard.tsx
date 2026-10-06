"use client";

import { useQueryClient } from "@tanstack/react-query";
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
import { analytics } from "@/lib/analytics";
import { log } from "@/lib/logger";
import { workspaceQueries } from "@/lib/query-keys";
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
 * saved the brand voice, the personas and the competitors. A failed analysis says what failed and
 * opens the workspace anyway; a stream that stops before the end offers a retry.
 */
export function WorkspaceCreateWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearCompletedOperation } = useSSE();
  const { checkLimit, canCreate, isLimitReached } = useCheckLimit("workspaces");

  const [operationId, setOperationId] = useState<string | null>(null);
  const [website, setWebsite] = useState("");
  const [streamProblem, setStreamProblem] = useState<string | null>(null);
  const slugRef = useRef<string | null>(null);

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

  const handleSubmit = async (data: WorkspaceFormData) => {
    if (!canCreate || isLimitReached || !checkLimit("create a workspace")) {
      return;
    }
    // Before creation: the list doesn't hold the new workspace yet.
    const isFirstWorkspace = workspaceList.length === 0;
    try {
      const workspace = await createWorkspace({
        name: data.name,
        url: data.url,
        timezone: data.timezone,
      });
      slugRef.current = workspace.slug;
      // The switcher's list stays cached for minutes; the sidebar needs the new workspace now.
      setCurrentWorkspace(workspace);
      queryClient.invalidateQueries({ queryKey: workspaceQueries.all() });
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
      toast.error((error as Error).message);
    }
  };

  if (!operationId) {
    return (
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
            <Input
              {...field}
              maxLength={200}
              placeholder="e.g. My company"
              autoFocus
            />
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
    );
  }

  const failed = findFailedEvent(events);
  return (
    <div className="space-y-4">
      <p className="text-body text-muted-foreground">
        Reading {website}. It usually takes one to two minutes. The workspace is
        already created, so you can leave this page.
      </p>
      <RunProgress stages={workspaceRunStages(events)} />
      {failed ? (
        <Notice
          tone="danger"
          title="The analysis stopped"
          action={
            <Button size="sm" onClick={() => openBrandVoice(false)}>
              Open the workspace
            </Button>
          }
        >
          {failed.message} Your workspace is created; you can read the website
          again from its Brand voice settings.
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
