"use client";

import { ArrowLeft, Check, Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLeaveGuard } from "@/components/forms/use-leave-guard";
import { WorkingSurface } from "@/components/layouts";
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
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { SafeLexicalEditor } from "@/components/ui/safe-lexical-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { useAutosave, type SaveState } from "@/hooks/use-autosave";
import { useAwaitingData } from "@/hooks/use-awaiting-data";
import { useAutosaveContent, useContentDetail } from "@/hooks/use-content";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { articleHtml } from "@/lib/content/article-html";
import { deriveImagesData } from "@/lib/content/image-data";
import {
  clearLocalDraft,
  type LocalDraft,
  readLocalDraft,
  writeLocalDraft,
} from "@/lib/content/local-draft";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

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
  articleHref: Route;
};

function ArticleEditor({
  workspaceId,
  contentId,
  title,
  serverMarkdown,
  articleHref,
}: EditorProps) {
  const router = useRouter();
  const { mutateAsync: saveArticle } = useAutosaveContent();
  // The text the editor starts from, and a key that restarts it when a draft is restored.
  const [start, setStart] = useState({ markdown: serverMarkdown, key: 0 });
  const [words, setWords] = useState(() => countWords(serverMarkdown));
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
      setWords(countWords(markdown));
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
    setWords(countWords(found.markdown));
    change(found.markdown);
    setFound(null);
  };

  const discard = () => {
    clearLocalDraft(contentId);
    setFound(null);
  };

  const guard = useLeaveGuard(state !== "saved");

  const done = async () => {
    if (await saveNow()) router.push(articleHref);
  };

  const minutes = Math.max(1, Math.round(words / WORDS_A_MINUTE));

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3 md:px-4">
        <Button asChild size="sm" variant="ghost">
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
        <Button size="sm" onClick={done} disabled={state === "saving"}>
          Done
        </Button>
      </header>

      {state === "failed" ? (
        <div className="border-b border-border bg-card px-4 py-3">
          <Notice
            tone="danger"
            title="Your last changes aren't saved yet"
            action={
              <Button size="sm" variant="outline" onClick={() => saveNow()}>
                Retry now
              </Button>
            }
          >
            Keep writing: they stay on this device, and save as soon as a try
            works.
          </Notice>
        </div>
      ) : null}

      {found ? (
        <div className="border-b border-border bg-card px-4 py-3">
          <Notice
            tone="info"
            title="Changes from an earlier visit weren't saved"
            action={
              <span className="flex gap-2">
                <Button size="sm" onClick={restore}>
                  Restore them
                </Button>
                <Button size="sm" variant="outline" onClick={discard}>
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

      <main
        className="min-h-0 flex-1 overflow-y-auto bg-card"
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
          if ((event.target as Element).closest("button")) edited();
        }}
      >
        {/* The shared editor layout: its frame and gutters, and the article's own title as the h1. */}
        <WorkingSurface title={title} ownHeading flush>
          <article className="prose lg:prose-lg prose-app mx-auto w-full pt-8 pb-24">
            {/* layout-ok: the article's own title, in its prose (WorkingSurface's ownHeading) */}
            <h1>{title}</h1>
            <SafeLexicalEditor
              key={start.key}
              readOnly={false}
              initialValue={start.markdown}
              onChange={handleChange}
              toolbarClass="not-prose top-0 z-10"
            />
          </article>
        </WorkingSurface>
      </main>

      <footer className="flex shrink-0 items-center justify-between border-t border-border bg-card px-4 py-2 text-caption text-muted-foreground">
        <span className="num">
          {words.toLocaleString()} {words === 1 ? "word" : "words"} · {minutes}{" "}
          min read
        </span>
      </footer>

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
 * The full-screen article editor (task 706): the article alone on the page, saved by itself as it
 * is written. The save state shows in the top bar; a save that fails says so and can be retried, and
 * the text stays on this device until a save works. Leaving asks only while a change isn't saved.
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
  const articleHref = useMemo(
    () => workspaceRoutes.contentDetail(workspaceSlug, contentId) as Route,
    [workspaceSlug, contentId],
  );
  const content = contentQuery.data?.content;
  // The article as it was when the editor opened: later refetches (the editor's own saves) must not
  // restart the editor under the person's cursor.
  const opened = useRef<{ id: string; title: string; markdown: string } | null>(
    null,
  );
  if (content && opened.current?.id !== content.id) {
    opened.current = {
      id: content.id,
      title: content.title,
      markdown: content.body_markdown ?? "",
    };
  }

  if (isWaiting || permissionLoading) {
    return (
      <main className="mx-auto flex h-dvh max-w-prose flex-col gap-4 px-4 pt-24">
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </main>
    );
  }

  if (!canUpdate) {
    return (
      <main className="grid h-dvh place-items-center px-4">
        <EmptyState
          as="h1"
          title="You can't edit this article"
          description="Editing needs the Update content permission: ask the workspace's owner."
          action={{ label: "Back to the article", href: articleHref }}
        />
      </main>
    );
  }

  if (!opened.current) {
    return (
      <main className="grid h-dvh place-items-center px-4">
        <EmptyState
          as="h1"
          title="This article couldn't be opened"
          description="It may have been removed, or the connection dropped."
          action={{
            label: "Back to Content",
            href: workspaceRoutes.content(workspaceSlug),
          }}
        />
      </main>
    );
  }

  return (
    <ArticleEditor
      key={opened.current.id}
      workspaceId={workspaceId}
      contentId={contentId}
      title={opened.current.title}
      serverMarkdown={opened.current.markdown}
      articleHref={articleHref}
    />
  );
}
