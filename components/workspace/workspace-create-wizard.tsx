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
import { CreationSteps } from "@/components/workspace/creation-steps";
import { WorkspaceTakingShape } from "@/components/workspace/workspace-taking-shape";
import { useCheckLimit } from "@/components/subscription/limit-check-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { usePersonas } from "@/hooks/use-personas";
import { useSSEChannel } from "@/hooks/use-sse-channel";
import { analytics } from "@/lib/analytics";
import { ApiError } from "@/lib/api-client/core";
import { log } from "@/lib/logger";
import {
  personaQueries,
  subscriptionQueries,
  workspaceQueries,
} from "@/lib/query-keys";
import {
  findFailedEvent,
  workspaceFindings,
  workspaceRunStages,
  workspaceStageDetails,
} from "@/lib/workspace/workspace-run-stages";
import { WorkspaceReviewStep } from "@/components/workspace/workspace-review-step";
import { useSSE } from "@/providers/sse-provider";
import {
  type WorkspaceFormData,
  workspaceFormSchema,
} from "@/schemas/workspace-schemas";
import { useWorkspaceCrudStore, useWorkspaceStore } from "@/stores/workspace";
import type { Route } from "next";

/**
 * Creating a workspace (plans/app/D-pages.md §2.9): a name and the website, then the backend's
 * analysis as the run component, fed by the operation's events. When it completes, the flow shows
 * what was read (WorkspaceReviewStep): the brand voice, the personas and the competitors the
 * analysis has already saved, editable, then Finish, which opens Generate content (FB2.1,
 * rext-control#682). A failed analysis says what failed and opens the workspace anyway; a stream
 * that stops before the end offers a retry. A workspace past the plan's limit (the backend's 429,
 * or a limit the page learns of after it loaded) gets a notice with the way to a bigger plan,
 * never a click that does nothing.
 */
export function WorkspaceCreateWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearCompletedOperation } = useSSE();
  const { checkLimit, canCreate, isLimitReached } = useCheckLimit("workspaces");

  const [operationId, setOperationId] = useState<string | null>(null);
  const [website, setWebsite] = useState("");
  const [streamProblem, setStreamProblem] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  // The analysis finished: the drafted details are reviewed here, in the flow.
  const [reviewing, setReviewing] = useState(false);
  const slugRef = useRef<string | null>(null);
  const idRef = useRef<string | null>(null);

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
    if (!idRef.current || !slugRef.current) return;
    // The new workspace's brand voice, personas and lists are read fresh from here on.
    queryClient.invalidateQueries({ queryKey: workspaceQueries.all() });
    setReviewing(true);
  }, [queryClient]);

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

  // The analysis as it goes (rext-control#845): where each stage stands and what it found, from
  // the operation's events. The author personas are saved inside the brand-voice step, so they
  // are read once that step has ended.
  const stages = workspaceRunStages(events);
  const findings = workspaceFindings(events);
  const voiceStage = stages.find(
    (stage) => stage.id === "workspace-brand-voice",
  )?.state;
  const voiceEnded = voiceStage === "complete";
  const personas = usePersonas(voiceEnded ? idRef.current : null);
  // The people are shown once there are some. An empty answer is not "no one": the run can still
  // save a persona after this step's event (it did, on staging), so the list is read again as each
  // later step ends, and only the review, after the run, says that no one is named.
  const named = (personas.data?.personas ?? []).flatMap((persona) => {
    const name = persona.full_name || persona.name;
    return name
      ? [{ name, title: persona.professional_title ?? undefined }]
      : [];
  });
  const people = named.length > 0 ? named : undefined;
  const stepsEnded = stages.filter(
    (stage) => stage.state === "complete",
  ).length;
  useEffect(() => {
    if (!voiceEnded || stepsEnded === 0 || !idRef.current) return;
    queryClient.invalidateQueries({
      queryKey: personaQueries.lists(idRef.current),
    });
  }, [voiceEnded, stepsEnded, queryClient]);

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
      idRef.current = workspace.id;
      // The switcher's list stays cached for minutes, and the switcher puts back the first
      // workspace of that list when the current one isn't in it. The new workspace joins the
      // list first, so the sidebar names it, and links to it, through the analysis and the review.
      queryClient.setQueryData(workspaceQueries.list().queryKey, (list) =>
        list && !list.workspaces.some((known) => known.id === workspace.id)
          ? { ...list, workspaces: [workspace, ...list.workspaces] }
          : list,
      );
      setCurrentWorkspace(workspace);
      queryClient.invalidateQueries({ queryKey: workspaceQueries.all() });
      // The plan's count above the form ("1 of 1 workspace on your plan") counts this one now.
      queryClient.invalidateQueries({
        queryKey: subscriptionQueries.usage().queryKey,
      });
      analytics.track("workspace_created", {
        workspace_id: workspace.id,
        first_workspace: isFirstWorkspace,
      });
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
        <CreationSteps current={0} />
        {limitReached && (
          <Notice
            tone="warning"
            title="Workspace limit reached"
            action={
              <Button data-rec="show" asChild variant="outline" size="sm">
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

  if (reviewing && idRef.current && slugRef.current) {
    return (
      <div className="flex flex-col gap-8">
        <CreationSteps current={2} />
        <WorkspaceReviewStep
          workspaceId={idRef.current}
          workspaceSlug={slugRef.current}
          website={website}
        />
      </div>
    );
  }

  const failed = findFailedEvent(events);
  return (
    <div className="space-y-6">
      <CreationSteps current={1} />
      <p className="text-body text-muted-foreground">
        Reading {website}. It usually takes one to two minutes. The workspace is
        already created, so you can leave this page.
      </p>
      {/* The stages with what each found, as the run reports it. */}
      <RunProgress
        stages={stages}
        details={workspaceStageDetails(
          findings,
          siteHost(website),
          people?.map((person) => person.name),
        )}
      />
      {failed ? (
        <Notice
          tone="danger"
          title="The analysis stopped"
          action={
            <Button
              data-rec="show"
              size="sm"
              onClick={() => openBrandVoice(false)}
            >
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
                data-rec="show"
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
              data-rec="show"
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
      {/* The workspace taking shape: each part in its shape, then the part itself. */}
      <WorkspaceTakingShape
        stages={stages}
        findings={findings}
        people={people}
      />
    </div>
  );
}

/** "rext.ai" from the address typed, for the stages' lines. */
function siteHost(website: string): string {
  try {
    return new URL(website).host.replace(/^www\./, "");
  } catch {
    return website || "your website";
  }
}
