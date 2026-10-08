"use client";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  History,
  ListChecks,
  ListTree,
  Loader2,
  Send,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DragHandlePlugin } from "@/components/editor/drag-handle-plugin";
import { FloatingToolbarPlugin } from "@/components/editor/floating-toolbar-plugin";
import { HistoryDrawer } from "@/components/editor/history-drawer";
import { SlashMenuPlugin } from "@/components/editor/slash-menu-plugin";
import { useLeaveGuard } from "@/components/forms/use-leave-guard";
import { ArticleChecklist } from "@/components/generate-content/article-checklist";
import { StructureTree } from "@/components/generate-content/structure-tree";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { SafeLexicalEditor } from "@/components/ui/safe-lexical-editor";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useAutosave, type SaveState } from "@/hooks/use-autosave";
import { useAwaitingData } from "@/hooks/use-awaiting-data";
import {
  useAutosaveContent,
  useContentDetail,
  useContentVersions,
} from "@/hooks/use-content";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWorkspacePermission } from "@/hooks/use-permission";
import {
  type ArticleChecks,
  articleChecks,
} from "@/lib/content/article-checks";
import { articleHtml } from "@/lib/content/article-html";
import type { PublishIntent } from "@/lib/content/publish-copy";
import { deriveImagesData } from "@/lib/content/image-data";
import {
  clearLocalDraft,
  type LocalDraft,
  readLocalDraft,
  writeLocalDraft,
} from "@/lib/content/local-draft";
import {
  articleStructure,
  sameHeading,
} from "@/lib/generate-content/article-structure";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";
import type { ContentItem, ContentVersion } from "@/types/content";

const WORDS_A_MINUTE = 225;

const countWords = (markdown: string) =>
  markdown.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;

const clockTime = (date: Date) =>
  date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

/** The save state in the top bar: what happened to the last change, in a word or two. */
function SaveStatus({
  state,
  savedAt,
}: {
  state: SaveState;
  savedAt: Date | null;
}) {
  if (state === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
        <Loader2 size={16} aria-hidden className="animate-spin" />
        Saving…
      </span>
    );
  }
  if (state === "failed") {
    return <span className="text-caption text-destructive">Not saved</span>;
  }
  if (state === "unsaved") {
    return (
      <span className="text-caption text-muted-foreground">
        Unsaved changes
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
      <Check size={16} aria-hidden />
      {savedAt ? `Saved · ${clockTime(savedAt)}` : "Saved"}
    </span>
  );
}

type EditorProps = {
  workspaceId: string;
  contentId: string;
  title: string;
  serverMarkdown: string;
  /** The article's checks as stored with it, for the checklist drawer. */
  checks: ArticleChecks;
  /** This person may publish: the top bar offers the Publish menu. */
  canPublish: boolean;
  /** The article's kept versions, or null where the backend keeps none: no History then. */
  versions: ContentVersion[] | null;
  /** A version was restored: the article as that left it. */
  onRestored: (article: ContentItem) => void;
  articleHref: Route;
};

function ArticleEditor({
  workspaceId,
  contentId,
  title,
  serverMarkdown,
  checks,
  canPublish,
  versions,
  onRestored,
  articleHref,
}: EditorProps) {
  const router = useRouter();
  const { mutateAsync: saveArticle } = useAutosaveContent();
  // The text the editor starts from, and a key that restarts it when a draft is restored.
  const [start, setStart] = useState({ markdown: serverMarkdown, key: 0 });
  // The text as it stands: the word count and the outline drawer read it.
  const [text, setText] = useState(serverMarkdown);
  const words = useMemo(() => countWords(text), [text]);
  // The drawers (the founder's pick for task 706): the outline on the left, the checklist on
  // the right, each over the page, at the shared sheet's own width, and closed again with Escape
  // or a click outside.
  const [drawer, setDrawer] = useState<
    "outline" | "checklist" | "history" | null
  >(null);
  // The text's own box: the outline looks for its headings here, not in the page around it.
  const textBox = useRef<HTMLDivElement>(null);
  // Text left on this device by an earlier visit whose save never worked.
  const [found, setFound] = useState<LocalDraft | null>(null);
  // Lexical rewrites the Markdown as it loads it, and reports it when the cursor is first placed.
  // Until the person edits something, that rewrite is the baseline, not a change to save.
  const touched = useRef(false);
  const edited = useCallback(() => {
    touched.current = true;
  }, []);
  // The copy on this device: the newest edit not yet written there, and the wait before it is.
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uncopied = useRef<string | null>(null);
  const copyToDevice = useCallback(() => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = null;
    if (uncopied.current !== null) writeLocalDraft(contentId, uncopied.current);
    uncopied.current = null;
  }, [contentId]);

  const save = useCallback(
    (markdown: string) =>
      saveArticle({
        workspaceId,
        contentId,
        data: {
          // Unchanged here; the request's type asks for it with every update.
          title,
          body_markdown: markdown,
          // The backend publishes the stored row, so the HTML and the image list go with the text.
          body_html: articleHtml(markdown),
          images_data: deriveImagesData(markdown),
        },
      }),
    [workspaceId, contentId, title, saveArticle],
  );

  const { state, savedAt, change, rebase, saveNow } = useAutosave({
    initial: serverMarkdown,
    save,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: read once, when the editor opens
  useEffect(() => {
    const draft = readLocalDraft(contentId);
    if (draft && draft.markdown !== serverMarkdown) setFound(draft);
    else if (draft) clearLocalDraft(contentId);
  }, [contentId]);

  const handleChange = useCallback(
    (markdown: string) => {
      setText(markdown);
      if (!touched.current) {
        rebase(markdown);
        return;
      }
      // The copy on this device, at most twice a second; the last edit always gets there.
      uncopied.current = markdown;
      if (!draftTimer.current) {
        draftTimer.current = setTimeout(copyToDevice, 500);
      }
      change(markdown);
    },
    [change, rebase, copyToDevice],
  );

  // Once everything is saved, the copy on this device has done its job.
  useEffect(() => {
    if (state !== "saved") return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = null;
    uncopied.current = null;
    if (touched.current) clearLocalDraft(contentId);
  }, [state, contentId]);

  // Leaving, by any way out (a link, "Leave anyway", a closed or reloaded tab): an edit still
  // waiting for its turn is copied to the device first.
  useEffect(() => {
    window.addEventListener("pagehide", copyToDevice);
    return () => {
      window.removeEventListener("pagehide", copyToDevice);
      copyToDevice();
    };
  }, [copyToDevice]);

  const restore = () => {
    if (!found) return;
    touched.current = true;
    setStart((current) => ({ markdown: found.markdown, key: current.key + 1 }));
    setText(found.markdown);
    change(found.markdown);
    setFound(null);
  };

  const discard = () => {
    clearLocalDraft(contentId);
    setFound(null);
  };

  const guard = useLeaveGuard(state !== "saved");
  const isMobile = useIsMobile();

  const done = async () => {
    if (await saveNow()) router.push(articleHref);
  };

  // Publishing is the article page's: it holds the sites, the confirmations and the schedule.
  // A choice here saves what is unsaved, then goes there with the choice, where it is asked for
  // as that page's own menu would ask. A save that fails keeps the person here, with its notice.
  const publish = async (intent: PublishIntent) => {
    if (await saveNow()) {
      router.push(`${articleHref}?publish=${intent}` as Route);
    }
  };

  const minutes = Math.max(1, Math.round(words / WORDS_A_MINUTE));

  // Read only while its drawer is open: the text changes with every key.
  const outline = useMemo(
    () => (drawer === "outline" ? articleStructure(text, [], false) : []),
    [drawer, text],
  );
  const hasChecks =
    checks.seoScore !== null ||
    checks.checklist !== null ||
    checks.trustScore !== null;

  // Two sections may share a heading: `occurrence` says which of them was picked.
  const goToHeading = (heading: string, occurrence: number) => {
    const matches = Array.from(
      textBox.current?.querySelectorAll("h1, h2, h3") ?? [],
    ).filter((element) => sameHeading(element.textContent ?? "", heading));
    const target = matches[occurrence] ?? matches[0];
    setDrawer(null);
    // After the drawer has gone: it holds the page still while it is open.
    if (target) {
      requestAnimationFrame(() =>
        target.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  };

  return (
    // Inside the app's shell (task 839), in the page's working surface. Full-bleed: it cancels the
    // surface's side gutters (16, 24 and 32 px), so its bar runs from edge to edge. The page
    // scrolls as every page does; the bar stays in view under the app's top bar, with a failed
    // save's notice. At least the height the shell leaves, so a short article's page is one colour.
    <div className="-mx-4 flex min-h-[calc(100dvh-var(--header-height)-var(--bottom-bar-height))] flex-col bg-card md:-mx-6 lg:min-h-[calc(100dvh-var(--header-height))] xl:-mx-8">
      <div className="sticky top-(--header-height) z-10">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3 md:px-4">
          <Button data-rec="show" asChild size="sm" variant="ghost">
            <Link href={articleHref} aria-label="Back to the article">
              <ArrowLeft size={16} aria-hidden />
              <span className="hidden md:inline">Article</span>
            </Link>
          </Button>
          <p className="hidden min-w-0 flex-1 truncate text-label font-medium text-foreground md:block">
            {title}
          </p>
          <div className="flex-1 md:flex-none" aria-live="polite">
            <SaveStatus state={state} savedAt={savedAt} />
          </div>
          <Button
            data-rec="show"
            size="sm"
            variant="ghost"
            aria-label="Outline"
            onClick={() => setDrawer("outline")}
          >
            <ListTree size={16} aria-hidden />
            <span className="hidden md:inline">Outline</span>
          </Button>
          {hasChecks ? (
            <Button
              data-rec="show"
              size="sm"
              variant="ghost"
              aria-label="Checklist"
              onClick={() => setDrawer("checklist")}
            >
              <ListChecks size={16} aria-hidden />
              <span className="hidden md:inline">Checklist</span>
            </Button>
          ) : null}
          {versions ? (
            <Button
              data-rec="show"
              size="sm"
              variant="ghost"
              aria-label="History"
              onClick={() => setDrawer("history")}
            >
              <History size={16} aria-hidden />
              <span className="hidden lg:inline">History</span>
            </Button>
          ) : null}
          {canPublish ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  data-rec="show"
                  size="sm"
                  variant="outline"
                  aria-label="Publish"
                  disabled={state === "saving"}
                >
                  <Send size={16} aria-hidden />
                  <span className="hidden md:inline">Publish</span>
                  <ChevronDown size={16} aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  data-rec="show"
                  onSelect={() => publish("publish")}
                >
                  Publish
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-rec="show"
                  onSelect={() => publish("draft")}
                >
                  Save as draft
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-rec="show"
                  onSelect={() => publish("pending")}
                >
                  Submit for review
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  data-rec="show"
                  onSelect={() => publish("schedule")}
                >
                  Schedule for later
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <Button
            data-rec="show"
            size="sm"
            onClick={done}
            disabled={state === "saving"}
          >
            Done
          </Button>
        </header>

        {state === "failed" ? (
          <div className="border-b border-border bg-card px-4 py-3">
            <Notice
              tone="danger"
              title="Your last changes aren't saved yet"
              action={
                <Button
                  data-rec="show"
                  size="sm"
                  variant="outline"
                  onClick={() => saveNow()}
                >
                  Retry now
                </Button>
              }
            >
              Keep writing: they stay on this device, and save as soon as a try
              works.
            </Notice>
          </div>
        ) : null}
      </div>

      {found ? (
        <div className="border-b border-border bg-card px-4 py-3">
          <Notice
            tone="info"
            title="Changes from an earlier visit weren't saved"
            action={
              <span className="flex gap-2">
                <Button data-rec="show" size="sm" onClick={restore}>
                  Restore them
                </Button>
                <Button
                  data-rec="show"
                  size="sm"
                  variant="outline"
                  onClick={discard}
                >
                  Discard them
                </Button>
              </span>
            }
          >
            They're still on this device, from{" "}
            {new Date(found.at).toLocaleString()}.
          </Notice>
        </div>
      ) : null}

      {/* A div: the shell's main element is the page's landmark. */}
      <div
        className="flex-1 bg-card"
        // What counts as an edit: typing, deleting, a shortcut, a paste, a cut, a drop, or a
        // toolbar button. Placing the cursor or moving it doesn't.
        onBeforeInputCapture={edited}
        onPasteCapture={edited}
        onCutCapture={edited}
        onDropCapture={edited}
        onKeyDownCapture={(event) => {
          if (
            event.ctrlKey ||
            event.metaKey ||
            event.key.length === 1 ||
            ["Enter", "Backspace", "Delete", "Tab"].includes(event.key)
          ) {
            edited();
          }
        }}
        onPointerDownCapture={(event) => {
          // The tools' buttons and the block menu's options, wherever they are drawn.
          if ((event.target as Element).closest('button, [role="option"]')) {
            edited();
          }
        }}
      >
        {/* The surface's gutters again, for the text. */}
        <div className="px-4 md:px-6 xl:px-8">
          <article className="prose lg:prose-lg prose-app mx-auto w-full pt-8 pb-24">
            {/* layout-ok: the article's own title, in its prose (WorkingSurface's ownHeading) */}
            <h1>{title}</h1>
            {/* The gutter the drag handle sits in, where there is room for one. */}
            <div
              ref={textBox}
              data-drag-gutter
              // A heading the outline goes to stops under the editor's bar, not behind it (the
              // page's own scroll padding already clears the app's top bar).
              className="relative lg:-ml-8 lg:pl-8 [&_:is(h1,h2,h3)]:scroll-mt-16"
            >
              <SafeLexicalEditor
                key={start.key}
                readOnly={false}
                initialValue={start.markdown}
                onChange={handleChange}
                // The page's own tools (task 706): a bar over the selection, a "/" menu for
                // blocks, a grip to drag them. No fixed toolbar, no frame round the text.
                toolbar={false}
                bare
                plugins={
                  <>
                    <FloatingToolbarPlugin />
                    <SlashMenuPlugin />
                    {isMobile ? null : <DragHandlePlugin />}
                  </>
                }
              />
            </div>
          </article>
        </div>
      </div>

      <footer className="flex shrink-0 items-center justify-between border-t border-border bg-card px-4 py-2 text-caption text-muted-foreground">
        <span className="num">
          {words.toLocaleString()} {words === 1 ? "word" : "words"} · {minutes}{" "}
          min read
        </span>
        <span className="hidden md:inline">
          Type / for blocks · select text to format
        </span>
      </footer>

      <Sheet
        open={drawer === "outline"}
        onOpenChange={(open) => !open && setDrawer(null)}
      >
        <SheetContent side="left" className="gap-0 p-0">
          <SheetHeader className="border-b border-border px-6 py-4">
            <SheetTitle>Outline</SheetTitle>
            <SheetDescription>
              The article's headings. Pick one to go to it.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            {outline.length > 0 ? (
              <StructureTree entries={outline} onPick={goToHeading} />
            ) : (
              <p className="px-2 text-table text-muted-foreground">
                No headings yet. Type / on an empty line to add one.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={drawer === "checklist"}
        onOpenChange={(open) => !open && setDrawer(null)}
      >
        <SheetContent side="right" className="gap-0 bg-card p-0">
          <SheetHeader className="border-b border-border px-6 py-4">
            <SheetTitle>Checklist</SheetTitle>
            <SheetDescription>
              From when the article was written. Changes made here aren't
              checked again yet.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-3">
            <ArticleChecklist
              seoScore={checks.seoScore}
              checklist={checks.checklist}
              trustScore={checks.trustScore}
            />
          </div>
        </SheetContent>
      </Sheet>

      {versions ? (
        <HistoryDrawer
          open={drawer === "history"}
          onClose={() => setDrawer(null)}
          workspaceId={workspaceId}
          contentId={contentId}
          versions={versions}
          beforeRestore={saveNow}
          onRestored={onRestored}
        />
      ) : null}

      <AlertDialog
        open={guard.isAsking}
        onOpenChange={(open) => !open && guard.stay()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave before your changes save?</AlertDialogTitle>
            <AlertDialogDescription>
              Your last changes haven't reached the server yet. They stay on
              this device, and the editor offers them again next time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={guard.leave}>
              Leave anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * The page's states before the editor itself (loading, no permission, no article), in the page's
 * working surface, with the room above and below that the editor itself doesn't take.
 */
function StatePage({
  title,
  ownHeading = true,
  children,
}: {
  title: string;
  /** False while loading: nothing in the page is a heading yet, so the title is given to screen readers. */
  ownHeading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="py-6">
      {ownHeading ? null : (
        // layout-ok: the page's heading while nothing on it is one yet (the surface draws none)
        <h1 className="sr-only">{title}</h1>
      )}
      {children}
    </div>
  );
}

/**
 * The article editor (task 706): the article alone in the page's area, saved by itself as it is
 * written. It sits in the app's shell like every page (task 839), under the shell's top bar, with
 * a bar of its own: the save state, the drawers, Publish and Done. A save that fails says so and
 * can be retried, and the text stays on this device until a save works. Leaving asks only while a
 * change isn't saved.
 */
export function ArticleEditPage({
  workspaceSlug,
  contentId,
}: {
  workspaceSlug: string;
  contentId: string;
}) {
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id || "";
  const contentQuery = useContentDetail(workspaceId, contentId);
  const isWaiting = useAwaitingData(contentQuery);
  const { hasPermission: canUpdate, isLoading: permissionLoading } =
    useWorkspacePermission(
      CONTENT_PERMISSIONS.UPDATE,
      workspaceId || undefined,
    );
  const { hasPermission: canPublish } = useWorkspacePermission(
    CONTENT_PERMISSIONS.PUBLISH,
    workspaceId || undefined,
  );
  const articleHref = useMemo(
    () => workspaceRoutes.contentDetail(workspaceSlug, contentId) as Route,
    [workspaceSlug, contentId],
  );
  const content = contentQuery.data?.content;
  // The article as it was when the editor opened: later refetches (the editor's own saves) must not
  // restart the editor under the person's cursor.
  const opened = useRef<{
    id: string;
    title: string;
    markdown: string;
    checks: ArticleChecks;
  } | null>(null);
  if (content && opened.current?.id !== content.id) {
    opened.current = {
      id: content.id,
      title: content.title,
      markdown: content.body_markdown ?? "",
      checks: articleChecks(content),
    };
  }

  // The History shows only where the backend keeps versions: its list answers.
  const versionsQuery = useContentVersions(workspaceId, contentId);
  const versions =
    versionsQuery.isSuccess && Array.isArray(versionsQuery.data?.versions)
      ? versionsQuery.data.versions
      : null;
  // A restore changes the article under the editor: it starts again on the restored text, with
  // that as its saved baseline.
  const [restores, setRestores] = useState(0);
  const restored = (article: ContentItem) => {
    opened.current = {
      id: article.id,
      title: article.title,
      markdown: article.body_markdown ?? "",
      checks: articleChecks(article),
    };
    setRestores((count) => count + 1);
  };

  if (isWaiting || permissionLoading) {
    return (
      <StatePage title="Edit article" ownHeading={false}>
        <div className="mx-auto flex max-w-prose flex-col gap-4 pt-16">
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </StatePage>
    );
  }

  if (!canUpdate) {
    return (
      <StatePage title="You can't edit this article">
        <EmptyState
          as="h1"
          title="You can't edit this article"
          description="Editing needs the Update content permission: ask the workspace's owner."
          action={{ label: "Back to the article", href: articleHref }}
        />
      </StatePage>
    );
  }

  if (!opened.current) {
    return (
      <StatePage title="This article couldn't be opened">
        <EmptyState
          as="h1"
          title="This article couldn't be opened"
          description="It may have been removed, or the connection dropped."
          action={{
            label: "Back to Content",
            href: workspaceRoutes.content(workspaceSlug),
          }}
        />
      </StatePage>
    );
  }

  return (
    <ArticleEditor
      key={`${opened.current.id}-${restores}`}
      workspaceId={workspaceId}
      contentId={contentId}
      title={opened.current.title}
      serverMarkdown={opened.current.markdown}
      checks={opened.current.checks}
      canPublish={canPublish}
      versions={versions}
      onRestored={restored}
      articleHref={articleHref}
    />
  );
}
