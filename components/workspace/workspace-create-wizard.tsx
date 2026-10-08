"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { FieldController } from "@/components/forms/field-controller";
import { FormShell } from "@/components/forms/form-shell";
import { useZodForm } from "@/components/forms/use-zod-form";
import { WithSidePane } from "@/components/layouts";
import { CreationSteps } from "@/components/workspace/creation-steps";
import {
  BehindTheScenes,
  BehindTheScenesStrip,
} from "@/components/workspace/workspace-behind-scenes";
import {
  AuthorPersonas,
  WorkspaceDraft,
} from "@/components/workspace/workspace-draft";
import { useCheckLimit } from "@/components/subscription/limit-check-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Meter } from "@/components/ui/meter";
import { Notice } from "@/components/ui/notice";
import { Textarea } from "@/components/ui/textarea";
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
  workspaceActivity,
  workspaceFindings,
  workspaceRunStages,
  workspaceStageDetails,
} from "@/lib/workspace/workspace-run-stages";
import { WorkspaceReviewStep } from "@/components/workspace/workspace-review-step";
import { useSSE } from "@/providers/sse-provider";
import {
  DESCRIPTION_LIMITS,
  normalizeWebsite,
  type WorkspaceFormData,
  workspaceFormSchema,
} from "@/schemas/workspace-schemas";
import { useWorkspaceCrudStore, useWorkspaceStore } from "@/stores/workspace";
import type { Route } from "next";

/**
 * Creating a workspace (plans/app/D-pages.md §2.9), as one surface from the address to the review
 * (rext-control#845): the workspace on the left, and behind the scenes on the right, with the
 * three steps in a row above both.
 * - **Your website:** a name and the address, beside the plan of what will happen: the three
 *   stages, each waiting, with what it does and about how long it takes.
 * - **Reading the site:** the workspace's draft takes shape in the sections the review will hold,
 *   each in its shape and then with what the run found; beside it the stages with what each found
 *   and the work as it happens, newest on top, all from the operation's events.
 * - **Review and finish:** the same sections, where they were, as fields to edit
 *   (WorkspaceReviewStep), then Finish, which opens Generate content (FB2.1, rext-control#682).
 *
 * **Without a website** (rext-control#853): "I don't have a website yet" on the first step swaps
 * the address for a description of the business. The run then writes the brand voice only, from
 * that description: one stage beside the workspace, and the competitors and personas say from the
 * start that there are none yet. Everything else is the same surface.
 *
 * A failed analysis says what failed and opens the workspace anyway; a stream that stops before
 * the end offers a retry. A workspace past the plan's limit (the backend's 429, or a limit the page
 * learns of after it loaded) gets a notice with the way to a bigger plan, never a click that does
 * nothing.
 */
export function WorkspaceCreateWizard({
  planCount = null,
}: {
  /** The plan's workspaces before this one, said above the form on the first step only. */
  planCount?: { used: number; max: number } | null;
} = {}) {
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
  // The same id as state, for the query that looks the workspace up when the wait goes quiet.
  const [createdId, setCreatedId] = useState<string | null>(null);

  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);
  const workspaceList = useWorkspaceStore((state) => state.workspaceList);
  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace,
  );

  const form = useZodForm(workspaceFormSchema, {
    defaultValues: {
      from: "website",
      name: "",
      url: "",
      description: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
  // The way in: a website to read, or a description of the business (rext-control#853). The form
  // keeps it through the wait and the review, so the stages and the words follow it there too.
  const withoutSite = form.watch("from") === "description";
  const kind = { withoutSite };
  const enter = (from: "website" | "description") => {
    form.setValue("from", from);
    // The other way's field leaves with its error; what was typed in it stays.
    form.clearErrors(["url", "description"]);
    window.requestAnimationFrame(() =>
      form.setFocus(from === "website" ? "url" : "description"),
    );
  };

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
  const stages = workspaceRunStages(events, kind);
  const findings = workspaceFindings(events);
  const voiceStage = stages.find(
    (stage) => stage.id === "workspace-brand-voice",
  )?.state;
  const voiceEnded = voiceStage === "complete";
  // A workspace made from a description has no one to read: its personas are not asked for.
  const personas = usePersonas(
    voiceEnded && !withoutSite ? idRef.current : null,
  );
  // The personas are saved during the run, and the save can land after this step's event (it did,
  // on staging: "no one named" during the wait, then a persona in the review). So the list is read
  // again as each later step ends, and an empty answer is the last word only once the run has
  // ended.
  const stepsEnded = stages.filter(
    (stage) => stage.state === "complete",
  ).length;
  useEffect(() => {
    if (!voiceEnded || withoutSite || stepsEnded === 0 || !idRef.current)
      return;
    queryClient.invalidateQueries({
      queryKey: personaQueries.lists(idRef.current),
    });
  }, [voiceEnded, withoutSite, stepsEnded, queryClient]);
  const failed = findFailedEvent(events);
  const read = personas.isSuccess
    ? (personas.data?.personas ?? []).flatMap((persona) => {
        const name = persona.full_name || persona.name;
        return name
          ? [{ name, title: persona.professional_title ?? undefined }]
          : [];
      })
    : undefined;
  // The run's own word on who it saved, once it gives it (a `personas` event); until then, and
  // from a backend that doesn't send it, the list read above.
  const people = findings.people ?? read;
  const peopleFinal =
    findings.people !== undefined || reviewing || Boolean(failed);

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
      const fromSite = data.from === "website";
      const workspace = await createWorkspace({
        name: data.name,
        timezone: data.timezone,
        ...(fromSite ? { url: data.url } : { description: data.description }),
      });
      slugRef.current = workspace.slug;
      idRef.current = workspace.id;
      setCreatedId(workspace.id);
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
        with_website: fromSite,
      });
      setWebsite(fromSite ? data.url : "");
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
      if (withoutSite && /description/i.test(message)) {
        form.setError(
          "description",
          { type: "server", message },
          { shouldFocus: true },
        );
      } else if (/website|url|domain/i.test(message)) {
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

  // The wait has gone quiet: no event at all some seconds after the workspace was made, or none
  // for a long while since the last one. The stream can die with the server (every deploy restarts
  // it) without an error ever reaching the page, and the wait then counted for ever. It looks the
  // workspace up instead and says what it finds (rext-control#845).
  const waiting = !!operationId && !reviewing;
  const eventsSeen = events.length;
  const [quiet, setQuiet] = useState(false);
  // Each new event starts the wait for the next one over.
  useEffect(() => {
    setQuiet(false);
    if (!waiting) return;
    const timer = window.setTimeout(
      () => setQuiet(true),
      eventsSeen === 0 ? FIRST_EVENT_WAIT_MS : QUIET_WAIT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [waiting, eventsSeen]);
  const lookedUp = useQuery({
    ...workspaceQueries.detail(createdId ?? ""),
    enabled: waiting && quiet && !!createdId,
    retry: false,
    staleTime: 0,
  });
  // The workspace isn't there: the create was answered and nothing was kept (seen once on staging,
  // in the minute after a restart). The person makes it again; what they typed is still in the form.
  const gone =
    waiting &&
    quiet &&
    lookedUp.error instanceof ApiError &&
    lookedUp.error.statusCode === 404;
  // Its run finished without the page hearing of it: on to the review.
  const finishedUnheard =
    waiting &&
    quiet &&
    lookedUp.data?.workspace.pipeline?.status === "completed";
  useEffect(() => {
    if (finishedUnheard) handleComplete();
  }, [finishedUnheard, handleComplete]);

  const createAgain = () => {
    disconnect();
    // The workspace that isn't there leaves the shell too: the switcher keeps the current one
    // when the list comes back empty, and would go on naming and linking to it.
    const lostId = idRef.current;
    queryClient.setQueryData(workspaceQueries.list().queryKey, (list) =>
      list
        ? {
            ...list,
            workspaces: list.workspaces.filter((known) => known.id !== lostId),
          }
        : list,
    );
    setCurrentWorkspace(null);
    slugRef.current = null;
    idRef.current = null;
    setCreatedId(null);
    setStreamProblem(null);
    setOperationId(null);
    queryClient.invalidateQueries({ queryKey: workspaceQueries.all() });
    queryClient.invalidateQueries({
      queryKey: subscriptionQueries.usage().queryKey,
    });
  };

  // What the Website field holds, as the address it will be read at (null until it makes one).
  const typedWebsite = form.watch("url");
  const reads =
    typeof typedWebsite === "string" ? normalizeWebsite(typedWebsite) : null;

  const step: 0 | 1 | 2 = !operationId ? 0 : reviewing ? 2 : 1;
  const site = siteHost(website || reads || "");
  const details = workspaceStageDetails(
    findings,
    site,
    people?.map((person) => person.name),
    peopleFinal,
    kind,
  );
  const scenes = {
    stages,
    details,
    activity: workspaceActivity(events, site, kind),
  };
  const plan = withoutSite
    ? "When you create the workspace, we draft its brand voice from what you tell us. It takes a few seconds, and you review everything before any of it is used. You can add a website later in the workspace's settings, and we read it then."
    : "When you create the workspace, we read your website and draft its brand voice, author personas and competitors. It takes about a minute, you can leave the page meanwhile, and you review everything before any of it is used.";

  let main: ReactNode;
  if (step === 0) {
    main = (
      <div className="space-y-6">
        {planCount && (
          <div className="space-y-2">
            <p className="num text-table text-muted-foreground">
              {planCount.used} of {planCount.max}{" "}
              {planCount.max === 1 ? "workspace" : "workspaces"} on your plan
            </p>
            <Meter
              value={planCount.used}
              max={planCount.max}
              low={planCount.used + 1 >= planCount.max}
            />
          </div>
        )}
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
          {withoutSite ? (
            <FieldController
              control={form.control}
              name="description"
              label="What does the business do?"
              description="What it sells and who buys it, in a sentence or two. We draft the brand voice from this, and you can change every word of it in the review."
              maxLength={DESCRIPTION_LIMITS.max}
              required
            >
              {(field) => (
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  rows={4}
                  placeholder="e.g. We sell hand-forged kitchen knives to home cooks who want one knife that lasts."
                />
              )}
            </FieldController>
          ) : (
            <FieldController
              control={form.control}
              name="url"
              label="Website"
              // The address that will be read, once what is typed makes one: "mysite.com" is
              // enough, and the form says where it goes.
              description={
                reads
                  ? `We'll read ${reads} to draft the workspace's brand voice, personas and competitors.`
                  : "We read it to draft the workspace's brand voice, personas and competitors."
              }
              required
            >
              {(field) => (
                // A text field: `type="url"` makes the browser refuse a bare domain in its own
                // words before the form can take it (rext-control#854).
                <Input
                  {...field}
                  type="text"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="url"
                  spellCheck={false}
                  placeholder="yoursite.com"
                />
              )}
            </FieldController>
          )}
          {/* The other way in: for someone with no website yet, and back. */}
          <p className="text-table text-muted-foreground">
            {withoutSite ? "Have a website after all? " : "No website yet? "}
            <button
              data-rec="show"
              type="button"
              className="font-medium text-foreground underline underline-offset-4"
              onClick={() => enter(withoutSite ? "website" : "description")}
            >
              {withoutSite ? "I have a website" : "I don't have a website yet"}
            </button>
          </p>
        </FormShell>
        {/* Under 1024 px nothing sits beside the form: what happens next follows it. */}
        <section
          aria-label="What happens next"
          className="space-y-3 border-t border-border pt-6 lg:hidden"
        >
          <h2 className="text-section text-foreground">What happens next</h2>
          <BehindTheScenes {...scenes} intro={plan} />
        </section>
      </div>
    );
  } else if (step === 2 && idRef.current && slugRef.current) {
    main = (
      <WorkspaceReviewStep
        workspaceId={idRef.current}
        workspaceSlug={slugRef.current}
        website={website}
        after={
          withoutSite ? (
            <section
              aria-label="Author personas"
              className="flex flex-col gap-3"
            >
              <h2 className="text-section text-foreground">Author personas</h2>
              <p className="text-table text-muted-foreground">
                None yet: there is no website to read the people from. You can
                add personas later.
              </p>
            </section>
          ) : (
            people !== undefined && (
              <section
                aria-label="Author personas"
                className="flex flex-col gap-3"
              >
                <h2 className="text-section text-foreground">
                  Author personas
                </h2>
                <AuthorPersonas people={people} />
              </section>
            )
          )
        }
      />
    );
  } else if (gone) {
    // Nothing of the wait is true any more: the notice stands alone.
    main = (
      <Notice
        tone="danger"
        title="This workspace wasn't saved"
        action={
          <Button data-rec="show" size="sm" onClick={createAgain}>
            Create it again
          </Button>
        }
      >
        Something went wrong on our side while it was being created, and it
        isn't there. Your name and {withoutSite ? "description" : "address"} are
        still in the form.
      </Notice>
    );
  } else {
    main = (
      <div className="space-y-6">
        <p className="text-body text-muted-foreground">
          {withoutSite
            ? "Drafting your brand voice from your description. It takes a few seconds."
            : `Reading ${website}. It usually takes about a minute.`}{" "}
          The workspace is already created, so you can leave this page.
        </p>
        <BehindTheScenesStrip {...scenes} />
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
            {failed.message} Your workspace is created;{" "}
            {withoutSite
              ? "you can write its brand voice in its settings."
              : "you can read the website again from its Brand voice settings."}
          </Notice>
        ) : (
          (streamProblem || quiet) && (
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
        {/* The workspace's draft: each section in its shape, then with what the run found. */}
        <WorkspaceDraft
          stages={stages}
          findings={findings}
          people={people}
          peopleFinal={peopleFinal}
          withoutSite={withoutSite}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CreationSteps current={step} withoutSite={withoutSite} />
      {/* From 1024 px the stages sit beside the workspace; under it the first step lists them
          after its form and the wait shows them as one line, so the pane's sheet gets no button. */}
      <WithSidePane
        sideTitle={step === 0 ? "What happens next" : "Behind the scenes"}
        showTitle
        trigger="inline"
        side={
          <BehindTheScenes {...scenes} intro={step === 0 ? plan : undefined} />
        }
      >
        {main}
      </WithSidePane>
    </div>
  );
}

// How long the wait may hear nothing before it looks the workspace up: the first event comes at
// once, and the longest step (the competitor search) says something within a minute.
const FIRST_EVENT_WAIT_MS = 20_000;
const QUIET_WAIT_MS = 150_000;

/** "rext.ai" from the address typed, for the stages' lines. */
function siteHost(website: string): string {
  try {
    return new URL(website).host.replace(/^www\./, "");
  } catch {
    return website || "your website";
  }
}
