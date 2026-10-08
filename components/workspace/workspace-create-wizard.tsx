"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { usePersonas } from "@/hooks/use-personas";
import { useWorkspaceCreateAnalytics } from "@/hooks/use-workspace-create-analytics";
import { useSSEChannel } from "@/hooks/use-sse-channel";
import { analytics } from "@/lib/analytics";
import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client/core";
import {
  dropCreateDraft,
  keepCreateDraft,
  readCreateDraft,
} from "@/lib/workspace/create-draft";
import { SERVER_UNREACHABLE } from "@/lib/api-client/server-away";
import { redirectToLogin } from "@/lib/auth-utils";
import { extractFieldErrors } from "@/lib/error-utils";
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
  defaultWorkspaceName,
  normalizeWebsite,
  type WorkspaceFormData,
  workspaceFormSchema,
  workspaceNameSchema,
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
  existing = null,
}: {
  /** The plan's workspaces before this one, said above the form on the first step only. */
  planCount?: { used: number; max: number } | null;
  /**
   * A workspace that exists already and has no brand voice yet: one made with "Skip for now"
   * (rext-control task 905). The same form without the name, the same wait and review; it sets
   * this workspace up and makes none.
   */
  existing?: {
    id: string;
    slug: string;
    name: string;
    /**
     * Its set-up is under way already (the page was left during the wait and opened again):
     * the run to follow, and the way it was started with. The wait is shown, not the form.
     */
    resume?: { operationId: string; website: string | null };
  } | null;
} = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearCompletedOperation } = useSSE();
  const { isLimitReached } = useCheckLimit("workspaces");

  const [operationId, setOperationId] = useState<string | null>(
    existing?.resume?.operationId ?? null,
  );
  const [website, setWebsite] = useState(existing?.resume?.website ?? "");
  const [streamProblem, setStreamProblem] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  // The API refused the session itself (rext-control tasks 854 and 858): said as that, with the
  // way to sign in again, never as a field's error.
  const [sessionEnded, setSessionEnded] = useState(false);
  // A refusal that names no field: said above the form until the next try, not in a toast that
  // is gone before it is read.
  const [refusal, setRefusal] = useState<string | null>(null);
  // The analysis finished: the drafted details are reviewed here, in the flow.
  const [reviewing, setReviewing] = useState(false);
  const slugRef = useRef<string | null>(
    existing?.resume ? existing.slug : null,
  );
  const idRef = useRef<string | null>(existing?.resume ? existing.id : null);
  // The same id as state, for the query that looks the workspace up when the wait goes quiet.
  const [createdId, setCreatedId] = useState<string | null>(
    existing?.resume ? existing.id : null,
  );

  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);
  const workspaceList = useWorkspaceStore((state) => state.workspaceList);
  // Whether the person has no workspace yet. The plan's own count says so when the page has it
  // (the page waits for that read before it shows the form); the store's list alone can still be
  // empty on a direct load of this page, for an account that has workspaces.
  const noneYet =
    !existing &&
    workspaceList.length === 0 &&
    (planCount === null || planCount.used === 0);
  // Under 1024 px the way past the form comes before it (see where it is rendered).
  const narrow = useIsMobile();
  // The same, as it was when the page opened: what analytics calls a first workspace.
  const startedWithNone = useRef(noneYet);
  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace,
  );

  const form = useZodForm(workspaceFormSchema, {
    defaultValues: {
      // A set-up picked up again was started from a description when there is no website.
      from:
        existing?.resume && !existing.resume.website
          ? "description"
          : "website",
      // A workspace being set up keeps its name: the form doesn't ask for it.
      name: existing?.name ?? "",
      url: "",
      description: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
  // The way in: a website to read, or a description of the business (rext-control#853). The form
  // keeps it through the wait and the review, so the stages and the words follow it there too.
  const withoutSite = form.watch("from") === "description";
  const kind = { withoutSite };

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
  const step: 0 | 1 | 2 = !operationId ? 0 : reviewing ? 2 : 1;
  // Where a newcomer stops, for analytics (rext-control task 854): each moment of the form, the
  // wait and the review, with nothing that was typed.
  const running =
    stages.find((stage) => stage.state === "active") ??
    stages.find((stage) => stage.state === "pending");
  const funnel = useWorkspaceCreateAnalytics({
    step,
    settingUp: Boolean(existing),
    firstWorkspace: startedWithNone.current,
    withWebsite: !withoutSite,
    stage:
      running?.id === "workspace-scrape"
        ? "reading"
        : running?.id === "workspace-competitors"
          ? "competitors"
          : "voice",
  });
  // An empty field is no error until the button is pressed (rext-control task 854). Leaving one
  // empty raised "required" at once, and with the caret waiting in the first field a tap anywhere
  // on the page was enough: two recorded newcomers met an error before they had tried anything,
  // and stopped there. A field with something in it is still checked as it is left, and once the
  // button has been pressed every field is.
  const leave = (field: { value: unknown; onBlur: () => void }) => {
    if (field.value || form.formState.submitCount > 0) field.onBlur();
  };
  const showWay = useCallback(
    (from: "website" | "description") => {
      form.setValue("from", from);
      // The other way's field leaves with its error; what was typed in it stays.
      form.clearErrors(["url", "description"]);
    },
    [form],
  );
  // The way in is in the address too, each choice a step of its own in the history. It lived in
  // the page alone: on a phone, going back from "I don't have a website yet" left the form
  // altogether, and it came back in its first state with the choice and what was typed gone. A
  // reload or a link keeps the way; Back returns to the other one, with the name still there.
  const onForm = useRef(true);
  onForm.current = step === 0;
  // Whether the tab's storage took what the form holds, the last time it was given it.
  const [draftKept, setDraftKept] = useState(true);
  useEffect(() => {
    // What this tab held when the page was left comes back with it: the way in (the address's
    // own word first, when it has one) and whatever was typed. Nothing restored is checked: no
    // field has been left yet.
    // (A workspace being set up has no draft: its form asks before it is left, like any other.)
    const draft = existing ? null : readCreateDraft();
    if (draft) {
      for (const field of ["name", "url", "description"] as const) {
        const kept = draft[field];
        if (kept) form.setValue(field, kept, { shouldDirty: true });
      }
      if (draft.from === "description" && !addressNamesWay()) {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}?from=description`,
        );
      }
    }
    const follow = () => {
      // The wait and the review belong to the way the workspace was made with.
      if (!onForm.current) return;
      const from = wayInAddress();
      if (form.getValues("from") !== from) showWay(from);
    };
    follow();
    window.addEventListener("popstate", follow);
    // And from here on, what the form holds is kept as it changes, until the workspace is made.
    const watching = form.watch((values) => {
      if (!onForm.current || existing) return;
      setDraftKept(
        keepCreateDraft({
          from: values.from,
          name: values.name,
          url: values.url,
          description: values.description,
        }),
      );
    });
    return () => {
      window.removeEventListener("popstate", follow);
      watching.unsubscribe();
    };
  }, [form, showWay, existing]);
  const enter = (from: "website" | "description") => {
    showWay(from);
    window.history.pushState(
      null,
      "",
      from === "description"
        ? `${window.location.pathname}?from=description`
        : window.location.pathname,
    );
    funnel.wayChosen(from);
    window.requestAnimationFrame(() =>
      form.setFocus(from === "website" ? "url" : "description"),
    );
  };
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

  // "Skip for now" (rext-control task 905): a workspace with no website, no description and no
  // analysis, so that nobody is stopped by this form. It takes the name already typed when that
  // is a name, else the person's own ("Ana's workspace"); the home page then offers what this
  // form asks for, and Generate works meanwhile.
  const { data: session } = useSession();
  const [skipping, setSkipping] = useState(false);
  const skip = async () => {
    if (skipping) return;
    funnel.skipped();
    if (isLimitReached) {
      setLimitReached(true);
      funnel.refused("limit", { way: "skipped" });
      return;
    }
    setLimitReached(false);
    setSessionEnded(false);
    setRefusal(null);
    setSkipping(true);
    const typed = workspaceNameSchema.safeParse(form.getValues("name"));
    const isFirstWorkspace = workspaceList.length === 0;
    try {
      const workspace = await createWorkspace({
        name: typed.success ? typed.data : defaultWorkspaceName(session?.user),
        timezone: form.getValues("timezone"),
      });
      dropCreateDraft();
      queryClient.setQueryData(workspaceQueries.list().queryKey, (list) =>
        list && !list.workspaces.some((known) => known.id === workspace.id)
          ? { ...list, workspaces: [workspace, ...list.workspaces] }
          : list,
      );
      setCurrentWorkspace(workspace);
      queryClient.invalidateQueries({ queryKey: workspaceQueries.all() });
      queryClient.invalidateQueries({
        queryKey: subscriptionQueries.usage().queryKey,
      });
      analytics.track("workspace_created", {
        workspace_id: workspace.id,
        first_workspace: isFirstWorkspace,
        with_website: false,
        way: "skipped",
      });
      // The workspace's home, where the card to finish setting up is.
      router.push("/");
    } catch (error) {
      setSkipping(false);
      log.error(
        "[Workspace create] Failed to make the skipped workspace",
        error,
      );
      const status = error instanceof ApiError ? error.statusCode : undefined;
      if (status === 429) {
        setLimitReached(true);
        funnel.refused("limit", { status, way: "skipped" });
        queryClient.invalidateQueries({
          queryKey: subscriptionQueries.usage().queryKey,
        });
      } else if (
        status === 401 ||
        (status === 422 && /authorization/i.test((error as Error).message))
      ) {
        setSessionEnded(true);
        funnel.refused("session", { status, way: "skipped" });
      } else {
        setRefusal(refusalWords(error));
        funnel.refused("backend", { status, way: "skipped" });
      }
    }
  };

  const handleSubmit = async (data: WorkspaceFormData) => {
    funnel.submitted();
    if (isLimitReached) {
      setLimitReached(true);
      funnel.refused("limit");
      return;
    }
    // A plan or a usage count that isn't known (still loading, or its call failed) stops nothing:
    // the backend holds the limit and answers 429 below. The button used to do nothing at all
    // then, with no word of why (rext-control task 858).
    setLimitReached(false);
    setSessionEnded(false);
    setRefusal(null);
    // Before creation: the list doesn't hold the new workspace yet.
    const isFirstWorkspace = workspaceList.length === 0;
    try {
      const fromSite = data.from === "website";
      if (existing) {
        // Setting up a workspace that is there already. A website is saved first and then read,
        // the two calls the workspace's settings make; a description starts the voice's draft.
        // Either answers with the run to follow, and the wait and the review are the create's.
        let operation: string;
        if (fromSite) {
          await apiClient.workspaces.update(existing.id, { url: data.url });
          operation = (
            await apiClient.workspaces.refreshBrandVoice(existing.id)
          ).operation_id;
        } else {
          operation = (
            await apiClient.workspaces.describeLater(
              existing.id,
              data.description,
            )
          ).operation_id;
        }
        slugRef.current = existing.slug;
        idRef.current = existing.id;
        setCreatedId(existing.id);
        queryClient.invalidateQueries({ queryKey: workspaceQueries.all() });
        setWebsite(fromSite ? data.url : "");
        setOperationId(operation);
        return;
      }
      const workspace = await createWorkspace({
        name: data.name,
        timezone: data.timezone,
        ...(fromSite ? { url: data.url } : { description: data.description }),
      });
      slugRef.current = workspace.slug;
      idRef.current = workspace.id;
      setCreatedId(workspace.id);
      // The workspace is made: nothing is left to come back to.
      dropCreateDraft();
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
        way: fromSite ? "website" : "description",
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
        funnel.refused("limit", { status: 429 });
        queryClient.invalidateQueries({
          queryKey: subscriptionQueries.usage().queryKey,
        });
        return;
      }
      // What the API answered, as a number: the refusal's words are never sent to analytics.
      const status = error instanceof ApiError ? error.statusCode : undefined;
      // The backend checks the name and that the website answers: say so beside the field.
      const message = (error as Error).message;
      // A refusal that names its field goes beside it, in the backend's own words; the field
      // not on screen (the address, when the business was described) says nothing.
      const refused = extractFieldErrors(error);
      // A session the API doesn't accept: 401, or a request that left without its token, which
      // the API answers as a missing "Authorization" field. No retyping fixes it, and the
      // backend's sentence for it is not for a person.
      if (
        status === 401 ||
        (status === 422 &&
          (Object.keys(refused).some((field) => /authorization/i.test(field)) ||
            /authorization/i.test(message)))
      ) {
        setSessionEnded(true);
        funnel.refused("session", { status });
        return;
      }
      const shown = (["name", "description", "url"] as const).find(
        (field) =>
          refused[field] &&
          (field === "name" || (field === "description") === withoutSite),
      );
      if (shown) {
        form.setError(
          shown,
          { type: "server", message: refused[shown] },
          { shouldFocus: true },
        );
        // A website the form took and the backend refused is one it couldn't reach.
        if (shown === "url") {
          funnel.refused("unreachable", { field: "website", status });
        } else {
          funnel.refused("backend", { field: shown, status });
        }
      } else if (withoutSite && /descri/i.test(message)) {
        form.setError(
          "description",
          { type: "server", message },
          { shouldFocus: true },
        );
        funnel.refused("backend", { field: "description", status });
      } else if (!withoutSite && /website|url|domain/i.test(message)) {
        form.setError(
          "url",
          { type: "server", message },
          { shouldFocus: true },
        );
        funnel.refused("unreachable", { field: "website", status });
      } else if (/name/i.test(message)) {
        form.setError(
          "name",
          { type: "server", message },
          { shouldFocus: true },
        );
        funnel.refused("backend", { field: "name", status });
      } else {
        setRefusal(refusalWords(error));
        funnel.refused("backend", { status });
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
  const plan = existing
    ? withoutSite
      ? "We draft the brand voice from what you tell us. It takes under half a minute, and you review everything before any of it is used. You can add a website later in the workspace's settings, and we read it then."
      : "We read your website and draft the brand voice, author personas and competitors. It takes about a minute, you can leave the page meanwhile, and you review everything before any of it is used."
    : withoutSite
      ? "When you create the workspace, we draft its brand voice from what you tell us. It takes under half a minute, and you review everything before any of it is used. You can add a website later in the workspace's settings, and we read it then."
      : "When you create the workspace, we read your website and draft its brand voice, author personas and competitors. It takes about a minute, you can leave the page meanwhile, and you review everything before any of it is used.";

  // A first workspace needs none of this to begin with: one plain way past the form. Under the
  // button where there is room for it. On a phone the button and anything under it sit below the
  // first screen and behind the tab bar, so there it comes first, where someone looking for a way
  // on will see it (rext-control task 905: the newcomer who opened this form eight times and
  // touched nothing was on a phone 360 wide). It is rendered once, in the place it is seen, so a
  // keyboard and a screen reader meet it in the same order as the eye does.
  const wayPast = noneYet ? (
    <p className="text-table text-muted-foreground">
      Not now?{" "}
      <button
        data-rec="show"
        type="button"
        className="font-medium text-foreground underline underline-offset-4 disabled:opacity-60"
        onClick={() => void skip()}
        disabled={skipping}
      >
        {skipping ? "Setting up your workspace" : "Skip for now"}
      </button>
      {skipping
        ? ""
        : " and tell Rext about your business later. You can start an article right away."}
    </p>
  ) : null;

  let main: ReactNode;
  if (step === 0) {
    main = (
      <div className="space-y-6">
        {narrow && wayPast}
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
        {sessionEnded && (
          <Notice
            tone="warning"
            title="You've been signed out"
            action={
              <Button
                data-rec="show"
                size="sm"
                onClick={() => redirectToLogin("SessionExpired")}
              >
                Sign in again
              </Button>
            }
          >
            The workspace wasn't created. Sign in again and you come straight
            back to this page.
          </Notice>
        )}
        {refusal && (
          <Notice tone="danger" title="The workspace wasn't created">
            {refusal}
          </Notice>
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
          // The button pressed with a field the form itself refuses: which one, never what it holds.
          onInvalid={(errors) =>
            funnel.refused("form", {
              field: errors.name
                ? "name"
                : errors.url
                  ? "website"
                  : errors.description
                    ? "description"
                    : undefined,
            })
          }
          // The next step, in its own words: what pressing it starts.
          submitLabel={withoutSite ? "Draft my brand voice" : "Read my website"}
          // What is typed here is kept for this tab until the workspace is made, so leaving
          // the page loses nothing and needs no question. Where the tab's storage refuses it
          // (switched off, or full), nothing is kept and the form asks like any other; so does
          // the form that sets up a workspace made earlier, which keeps no draft.
          keepsDraft={!existing && draftKept}
          // Nowhere to cancel to without a workspace: the home page leads straight back here,
          // with the form emptied.
          cancel={noneYet ? undefined : { onCancel: () => router.push("/") }}
        >
          {/* A workspace being set up has its name already. */}
          {!existing && (
            <FieldController
              control={form.control}
              name="name"
              // The fields ask, and hold no example text: grey words inside an empty field read as
              // an answer already given, and the form looked finished (rext-control task 854).
              // The example is in the line under each.
              label="What is your business called?"
              description="For example: Luna Bakery. It names the workspace, and you can change it later."
              required
            >
              {(field) => (
                // The caret waits here on arrival: plainly empty, and the place to start.
                <Input
                  {...field}
                  autoFocus
                  maxLength={200}
                  onKeyDown={() => funnel.fieldTyped("name")}
                  onPaste={() => funnel.fieldTyped("name")}
                  onBlur={() => {
                    leave(field);
                    funnel.fieldLeft("name", field.value);
                  }}
                />
              )}
            </FieldController>
          )}
          {withoutSite ? (
            <FieldController
              control={form.control}
              name="description"
              label={
                existing
                  ? "What does your business do?"
                  : "What does the business do?"
              }
              description="What it sells and who buys it, in a sentence or two. For example: We sell hand-forged kitchen knives to home cooks. We draft the brand voice from this, and you can change every word of it in the review."
              maxLength={DESCRIPTION_LIMITS.max}
              required
            >
              {(field) => (
                <Textarea
                  {...field}
                  onKeyDown={() => funnel.fieldTyped("description")}
                  onPaste={() => funnel.fieldTyped("description")}
                  onBlur={() => {
                    leave(field);
                    funnel.fieldLeft("description", field.value);
                  }}
                  value={field.value ?? ""}
                  rows={4}
                />
              )}
            </FieldController>
          ) : (
            <FieldController
              control={form.control}
              name="url"
              label={
                existing ? "What is your website?" : "What is its website?"
              }
              // The address that will be read, once what is typed makes one: "mysite.com" is
              // enough, and the form says where it goes.
              description={
                reads
                  ? `We'll read ${reads} to draft the workspace's brand voice, personas and competitors.`
                  : "yoursite.com is enough. We read it to draft the workspace's brand voice, personas and competitors."
              }
              required
            >
              {(field) => (
                // A text field: `type="url"` makes the browser refuse a bare domain in its own
                // words before the form can take it (rext-control#854).
                <Input
                  {...field}
                  onKeyDown={() => funnel.fieldTyped("website")}
                  onPaste={() => funnel.fieldTyped("website")}
                  onBlur={() => {
                    leave(field);
                    funnel.fieldLeft("website", field.value);
                  }}
                  type="text"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="url"
                  spellCheck={false}
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
        {!narrow && wayPast}
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
        withoutSite={withoutSite}
        onFinished={funnel.reviewFinished}
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
            ? "Drafting your brand voice from your description. It takes under half a minute."
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

/** The way in the address names: `?from=description`, or the website. */
function wayInAddress(): "website" | "description" {
  return new URLSearchParams(window.location.search).get("from") ===
    "description"
    ? "description"
    : "website";
}

/** Whether the address says which way in at all (a link, or a step back to one). */
function addressNamesWay(): boolean {
  return new URLSearchParams(window.location.search).has("from");
}

/**
 * What to say for a refusal that names no field. The backend's own sentence when the refusal is
 * the request's (a 4xx) and reads as one; ours when the server failed or couldn't be reached.
 */
function refusalWords(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Something went wrong on our side. Try again in a moment.";
  }
  if (error.code === SERVER_UNREACHABLE) {
    return "We couldn't reach the server. Try again in a moment.";
  }
  if (error.statusCode >= 400 && error.statusCode < 500) {
    const said = error.message.trim();
    return said && !/^request failed|field required|[{}<>]/i.test(said)
      ? said
      : "Check the name and the website, then try again.";
  }
  return "Something went wrong on our side. Try again in a moment.";
}

/** "rext.ai" from the address typed, for the stages' lines. */
function siteHost(website: string): string {
  try {
    return new URL(website).host.replace(/^www\./, "");
  } catch {
    return website || "your website";
  }
}
