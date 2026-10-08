"use client";

import { RotateCcw } from "lucide-react";
import {
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { SidePaneTrigger, WithSidePane } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { usePersonas } from "@/hooks/use-personas";
import type { WordCountRange } from "@/lib/generate-content/content-type-word-count";
import {
  type BrandProminence,
  blocksShowFaqs,
  buildOutlineApproval,
  canAddSection,
  canRestoreRow,
  changeLevel,
  insertAnnouncement,
  insertRow,
  levelAnnouncement,
  MAX_ADDED_SECTIONS,
  moveAnnouncement,
  moveBlockTo,
  moveRow,
  type OutlineApproval,
  outlineIsEmpty,
  readOnlyBlocks,
  readOutlineFaqs,
  readOutlineGate,
  removalAnnouncement,
  removeRow,
  renameRow,
  restoreAnnouncement,
  restoreRow,
  rowsEdited,
  rowsFromGate,
  streamedField,
  streamedHeadings,
  type TreeRow,
} from "@/lib/generate-content/outline-review";
import { PERSONA_PERMISSIONS } from "@/lib/permissions";
import type {
  KeywordCluster,
  Outline,
  OutlineRenderBlock,
} from "@/types/generate-content";
import { OutlineApproveBar } from "./approve-bar";
import { OutlineBrief } from "./outline-brief";
import {
  hasSources,
  OutlineSources,
  type OutlineSourcesProps,
} from "./outline-sources";
import { ADD_CAP_REASON, OutlineTree, StreamingTree } from "./outline-tree";

export interface OutlineReviewProps {
  /** The parsed outline; null while it streams. */
  outline: Outline | null;
  /** The outline model's JSON so far, one token per stream event. */
  rawTokens: string;
  isLoading: boolean;
  /** The outline gate's interrupt value, as the backend sent it. */
  gate: unknown;
  workspaceId?: string | null;
  keywordClusters?: KeywordCluster[];
  pendingTargetWordCount?: number | null;
  wordCountRange?: WordCountRange | null;
  onUpdate?: (outline: Outline) => void;
  onReject: () => void;
  onApprove: (approval: OutlineApproval) => void;
  /**
   * While the first outline is written (rext-control#694, the second pass): what the run has of it
   * so far, read by its stages rather than from `rawTokens`, and the stages themselves, for the
   * side pane from 1024 px (`progress`) and as one line above the outline under it (`strip`).
   */
  filling?: {
    title?: string;
    headings: string[];
    /** What the run read before it began the outline: the gate, which carries them later, isn't here yet. */
    sources?: Pick<
      OutlineSourcesProps,
      "serpResults" | "questions" | "relatedSearches"
    >;
    progress: ReactNode;
    strip: ReactNode;
  };
}

/**
 * Step 5, the outline (plans/app/E-workflow.md §4, design/app-language.md §6,
 * WorkingSurface): the outline as a document's outline the user reorders,
 * renames, re-levels, adds to and trims (rext-control#696), its FAQ read-only
 * beneath, the brief beside it, and a Sources view of what the outline rests
 * on. The user's order, headings and levels go back with the approval, and the
 * article is written that way. A polite live region says what each edit did.
 */
export function OutlineReview({
  outline,
  rawTokens,
  isLoading,
  gate: gateValue,
  workspaceId,
  keywordClusters = [],
  pendingTargetWordCount,
  wordCountRange,
  onUpdate,
  onReject,
  onApprove,
  filling,
}: OutlineReviewProps) {
  const gate = useMemo(() => readOutlineGate(gateValue), [gateValue]);
  const isDraft = !outline;
  const editable = !isDraft && !isLoading;

  // The tree starts from what the gate offers, and again when it offers a new
  // outline (after a regeneration): any change to a row's id, list, heading or
  // level, so a regenerated hierarchy is never sent back stale.
  const offeredKey = JSON.stringify(gate.sections);
  const [rows, setRows] = useState<TreeRow[]>(() =>
    rowsFromGate(gate.sections),
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: offeredKey stands for gate.sections' content
  useEffect(() => setRows(rowsFromGate(gate.sections)), [offeredKey]);

  const defaultProminence: BrandProminence =
    gate.recommendedProminence ??
    (gate.brandPromotion?.recommended ? "prominent" : "none");
  const [prominence, setProminence] =
    useState<BrandProminence>(defaultProminence);
  useEffect(() => setProminence(defaultProminence), [defaultProminence]);

  const sortedLinks = useMemo(
    () => [...gate.internalLinks].sort((a, b) => b.score - a.score),
    [gate.internalLinks],
  );
  const [linkUrls, setLinkUrls] = useState<Set<string>>(new Set());
  useEffect(() => {
    setLinkUrls(
      new Set(
        sortedLinks.filter((link) => link.score >= 0.5).map((link) => link.url),
      ),
    );
  }, [sortedLinks]);

  const {
    data: personasData,
    refetch: refetchPersonas,
    isFetching: personasFetching,
    isLoading: personasLoading,
    isError: personasFailed,
  } = usePersonas(workspaceId || null);
  const personas = useMemo(() => personasData?.personas ?? [], [personasData]);
  // Creating a persona here needs the same permission as its page; the backend checks it again.
  const { hasPermission: mayCreatePersona, isLoading: permissionLoading } =
    useWorkspacePermission(
      PERSONA_PERMISSIONS.CREATE,
      workspaceId ?? undefined,
    );
  const [personaId, setPersonaId] = useState<string | null>(null);
  // Adopt each recommendation exactly once. Tracking the recommendation already
  // applied, rather than deriving a selection on every render, is what makes
  // the choice stick: an unrelated edit (tone, audience, word count) replaces
  // the outline object, and must not undo the author the user picked.
  const appliedRecommendation = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!outline) return;
    const recommendation = outline.selected_persona_id ?? null;
    if (appliedRecommendation.current === recommendation) return;
    appliedRecommendation.current = recommendation;
    setPersonaId(recommendation);
  }, [outline]);

  const title =
    outline?.title ?? filling?.title ?? streamedField(rawTokens, "title");
  const brief = outline?.brief ?? streamedField(rawTokens, "brief");
  const sources = {
    serpResults: filling?.sources?.serpResults ?? gate.serpResults,
    questions: filling?.sources?.questions ?? gate.questions,
    relatedSearches: filling?.sources?.relatedSearches ?? gate.relatedSearches,
    clusters: keywordClusters,
    clusterHeadings: outline?.cluster_heading_map,
  };
  // While the first outline is written the sources sit under it, in the Outline tab.
  const sourcesTab = !filling && hasSources(sources);
  const sourcesId = useId();
  const edited = rowsEdited(rows, gate.sections);
  const faqs = useMemo(() => readOutlineFaqs(outline), [outline]);

  // What each edit did, for a screen reader. A new node each time, so the same words twice are
  // announced twice.
  const [announcement, setAnnouncement] = useState({ id: 0, text: "" });
  const announce = (text: string) =>
    setAnnouncement((current) => ({ id: current.id + 1, text }));
  // The rows as they are when a toast's Undo is pressed, seconds after the toast was made.
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);
  const headingOf = (key: string) =>
    rows.find((row) => row.key === key)?.heading ?? "The section";

  const move = (key: string, offset: -1 | 1) => {
    const next = moveRow(rows, key, offset);
    if (next === rows) {
      announce(`${headingOf(key)} can't move ${offset < 0 ? "up" : "down"}.`);
      return false;
    }
    setRows(next);
    announce(moveAnnouncement(rows, next, key));
    return true;
  };

  const moveTo = (key: string, gap: number) => {
    const next = moveBlockTo(rows, key, gap);
    if (next === rows) return false;
    setRows(next);
    announce(moveAnnouncement(rows, next, key));
    return true;
  };

  const setLevel = (key: string, level: "H2" | "H3") => {
    const next = changeLevel(rows, key, level);
    if (next === rows) {
      announce(
        levelRefusal(
          rows.find((row) => row.key === key),
          level,
        ),
      );
      return false;
    }
    setRows(next);
    announce(levelAnnouncement(next, key));
    return true;
  };

  const insert = (
    list: string,
    gap: number,
    heading: string,
    level: "H2" | "H3",
  ) => {
    if (!canAddSection(rows)) {
      announce(`${ADD_CAP_REASON}.`);
      return false;
    }
    const next = insertRow(rows, list, gap, heading, level);
    if (next === rows) return false;
    setRows(next);
    announce(insertAnnouncement(next, list, gap));
    return true;
  };

  const restore = (removed: TreeRow, subsections: number) => {
    const current = rowsRef.current;
    if (!canRestoreRow(current, removed.key)) {
      // Bringing it back would pass the backend's cap on added sections, which drops the rest unsaid.
      const reason = `Can't undo: one approval adds at most ${MAX_ADDED_SECTIONS} sections. Remove one first.`;
      toast(reason);
      announce(reason);
      return;
    }
    setRows(restoreRow(current, removed.key));
    announce(restoreAnnouncement(removed.heading, subsections));
  };

  const remove = (key: string) => {
    const { rows: next, removed, subsections } = removeRow(rows, key);
    if (!removed) {
      announce(
        `${headingOf(key)} can't be removed: an article keeps at least one section here.`,
      );
      return false;
    }
    setRows(next);
    // An H2 takes its subsections with it: say so, since they vanish from the tree too.
    const withSubsections =
      subsections === 0
        ? ""
        : ` and its ${subsections === 1 ? "subsection" : `${subsections} subsections`}`;
    toast(`Removed "${removed.heading}"${withSubsections}`, {
      action: {
        label: "Undo",
        onClick: () => restore(removed, subsections),
      },
    });
    announce(removalAnnouncement(removed.heading, subsections));
    return true;
  };

  const approve = () =>
    onApprove(
      buildOutlineApproval({
        tone: outline?.tone,
        targetAudience: outline?.target_audience,
        targetWordCount: outline?.target_word_count,
        gate,
        selectedLinks: sortedLinks.filter((link) => linkUrls.has(link.url)),
        prominence,
        personaId,
        rows,
      }),
    );

  const briefPane = outline ? (
    <OutlineBrief
      outline={outline}
      canEdit={editable && !!onUpdate}
      pendingTargetWordCount={pendingTargetWordCount}
      wordCountRange={wordCountRange}
      onUpdate={onUpdate}
      personas={personas}
      personaRecommendations={outline.persona_recommendations ?? []}
      personaId={personaId}
      onPersonaChange={setPersonaId}
      onRefreshPersonas={() => void refetchPersonas()}
      refreshingPersonas={personasFetching}
      // A list not yet known is neither empty nor there: only a loaded list picks a branch.
      personasLoading={!personasData && personasLoading}
      personasFailed={!personasData && personasFailed}
      canCreatePersona={mayCreatePersona && !permissionLoading}
      brandPromotion={gate.brandPromotion}
      recommendedProminence={gate.recommendedProminence}
      prominence={prominence}
      onProminenceChange={setProminence}
      internalLinks={sortedLinks}
      selectedLinkUrls={linkUrls}
      onToggleLink={(url, selected) =>
        setLinkUrls((current) => {
          const next = new Set(current);
          if (selected) next.add(url);
          else next.delete(url);
          return next;
        })
      }
    />
  ) : (
    <BriefSkeleton />
  );

  const treePane = isDraft ? (
    filling && hasSources(sources) ? (
      // The first outline can take half a minute, and its sections often arrive together: what it
      // is being written from is real, already here, and worth reading meanwhile. Once the outline
      // is in, the same sources are the Sources tab.
      <div className="space-y-8">
        <StreamingTree headings={filling.headings} />
        <section aria-labelledby={sourcesId} className="space-y-4">
          <div className="space-y-1">
            <h3 id={sourcesId} className="text-section text-foreground">
              What the outline is written from
            </h3>
            <p className="text-table text-muted-foreground">
              The sections take their place above as soon as they are written.
            </p>
          </div>
          <OutlineSources {...sources} />
        </section>
      </div>
    ) : (
      <StreamingTree
        headings={filling?.headings ?? streamedHeadings(rawTokens)}
      />
    )
  ) : rows.length > 0 ? (
    <div className="space-y-6">
      <OutlineTree
        rows={rows}
        outline={outline}
        title={title || undefined}
        addableLists={gate.addableLists}
        editable={editable}
        onMove={move}
        onMoveTo={moveTo}
        onChangeLevel={setLevel}
        onRename={(key, heading) =>
          setRows((current) => renameRow(current, key, heading))
        }
        onRemove={remove}
        onInsert={insert}
      />
      {faqs.length > 0 && <FaqList questions={faqs} />}
    </div>
  ) : (
    <ReadOnlyOutline blocks={readOnlyBlocks(outline)} faqs={faqs} />
  );

  // An outline that came back with nothing in it (task 783): say so, and offer only Regenerate.
  // A regenerated outline arrives as a new gate and takes this notice's place.
  if (outlineIsEmpty(outline, gate)) {
    return (
      <div className="w-full space-y-6 py-3">
        <Notice tone="warning" title="The outline couldn't be drafted">
          It came back empty, so there is nothing to approve. Regenerate it to
          try again.
        </Notice>
        <OutlineApproveBar
          disabled={isLoading}
          canApprove={false}
          onRegenerate={onReject}
          onApprove={approve}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 py-3">
      <header className="space-y-2">
        {title ? (
          <h2 className="font-display text-page-title text-foreground">
            {title}
          </h2>
        ) : (
          <Skeleton className="h-8 w-2/3" />
        )}
        {brief && (
          <p className="max-w-prose text-body text-muted-foreground">{brief}</p>
        )}
      </header>

      {/* Under 1024 px the Brief opens from the approve bar: a floating button would cover the
          right-aligned Regenerate and Approve that end the page (E28). */}
      <WithSidePane
        side={
          filling ? (
            <div className="space-y-6">
              {filling.progress}
              {briefPane}
            </div>
          ) : (
            briefPane
          )
        }
        sideTitle="Brief"
        trigger="inline"
      >
        <div className="space-y-6">
          {filling?.strip}
          <Tabs defaultValue="outline">
            <div className="flex items-center justify-between gap-2">
              <TabsList>
                <TabsTrigger value="outline">Outline</TabsTrigger>
                {sourcesTab && (
                  <TabsTrigger value="sources">Sources</TabsTrigger>
                )}
              </TabsList>
              {editable && edited && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRows(rowsFromGate(gate.sections));
                    announce("The sections are back as they were generated.");
                  }}
                >
                  <RotateCcw />
                  Reset sections
                </Button>
              )}
            </div>
            <TabsContent value="outline" className="mt-4">
              {treePane}
              <div aria-live="polite" className="sr-only">
                {announcement.text && (
                  <span key={announcement.id}>{announcement.text}</span>
                )}
              </div>
            </TabsContent>
            {sourcesTab && (
              <TabsContent value="sources" className="mt-4">
                <OutlineSources {...sources} />
              </TabsContent>
            )}
          </Tabs>

          <OutlineApproveBar
            disabled={isLoading || isDraft}
            reason={
              filling
                ? "You can approve once the outline is written."
                : undefined
            }
            onRegenerate={onReject}
            onApprove={approve}
            start={<SidePaneTrigger size="default" className="mr-auto" />}
          />
        </div>
      </WithSidePane>
    </div>
  );
}

/** What the live region says when a level can't change. */
function levelRefusal(row: TreeRow | undefined, level: "H2" | "H3"): string {
  if (!row) return "";
  if (!row.level) return `${row.heading} has no heading level to change.`;
  if (row.level === "H4") return `${row.heading} is an H4; it keeps its level.`;
  if (row.level === level)
    return `${row.heading} is already a ${level === "H2" ? "section" : "subsection"}.`;
  return `${row.heading} can't be a subsection: it's the first section.`;
}

/**
 * The FAQ's questions under the sections, read-only: they aren't body headings, and approval sends
 * no edits to them (they feed the FAQ block and its structured data).
 */
function FaqList({ questions }: { questions: string[] }) {
  const labelId = useId();
  return (
    <section aria-labelledby={labelId} className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id={labelId} className="text-label text-muted-foreground">
          FAQ
        </h3>
        <p className="text-caption text-muted-foreground num">
          {questions.length} {questions.length === 1 ? "question" : "questions"}
        </p>
      </div>
      <div className="rounded-md border border-border bg-card">
        <ol className="divide-y divide-border">
          {questions.map((question, index) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: a read-only list that never reorders, whose questions may repeat
              key={`${index}-${question}`}
              className="flex items-start gap-2.5 px-3 py-2.5 text-table text-foreground"
            >
              <span
                aria-hidden="true"
                className="w-5 shrink-0 text-right text-muted-foreground num"
              >
                {index + 1}
              </span>
              {question}
            </li>
          ))}
        </ol>
        <p className="border-t border-border px-3 py-2.5 text-caption text-muted-foreground">
          Answered at the end of the article. To change them, regenerate with
          feedback.
        </p>
      </div>
    </section>
  );
}

/**
 * An outline whose sections the gate offers no edits for, with its FAQ beneath unless the blocks
 * already show it: the backend's blocks often hold one headed "Faqs", and the questions show once.
 */
function ReadOnlyOutline({
  blocks,
  faqs,
}: {
  blocks: OutlineRenderBlock[];
  faqs: string[];
}) {
  const listFaqs = faqs.length > 0 && !blocksShowFaqs(blocks, faqs);
  if (!listFaqs) return <ReadOnlyBlocks blocks={blocks} />;
  return (
    <div className="space-y-6">
      <ReadOnlyBlocks blocks={blocks} />
      <FaqList questions={faqs} />
    </div>
  );
}

/** An outline whose sections the gate offers no edits for: shown as it is. */
function ReadOnlyBlocks({ blocks }: { blocks: OutlineRenderBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => (
        <section key={block.heading} aria-label={block.heading}>
          <h3 className="mb-2 text-label text-muted-foreground">
            {block.heading}
          </h3>
          <ol className="divide-y divide-border rounded-md border border-border bg-card">
            {block.items.map((item, index) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: a read-only list that never reorders, whose labels may repeat
                key={`${index}-${item.label}`}
                className="space-y-1 px-3 py-2.5"
              >
                <p className="text-body font-medium text-foreground">
                  {item.label}
                </p>
                {item.points.length > 0 && (
                  <ul className="list-disc space-y-0.5 pl-4 text-table text-muted-foreground marker:text-muted-foreground">
                    {item.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function BriefSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {[0, 1, 2].map((group) => (
        <div key={group} className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}
