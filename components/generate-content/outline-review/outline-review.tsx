"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { WithSidePane } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePersonas } from "@/hooks/use-personas";
import type { WordCountRange } from "@/lib/generate-content/content-type-word-count";
import {
  addRow,
  type BrandProminence,
  buildOutlineApproval,
  moveRow,
  type OutlineApproval,
  readOnlyBlocks,
  readOutlineGate,
  removeRow,
  renameRow,
  replaceList,
  restoreRow,
  rowsEdited,
  rowsFromGate,
  streamedField,
  streamedHeadings,
  type TreeRow,
} from "@/lib/generate-content/outline-review";
import type {
  KeywordCluster,
  Outline,
  OutlineRenderBlock,
} from "@/types/generate-content";
import { OutlineApproveBar } from "./approve-bar";
import { OutlineBrief } from "./outline-brief";
import { hasSources, OutlineSources } from "./outline-sources";
import { OutlineTree, StreamingTree } from "./outline-tree";

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
}

/**
 * Step 5, the outline (plans/app/E-workflow.md §4, design/app-language.md §6,
 * WorkingSurface): the outline as a tree the user reorders, renames and trims,
 * the brief beside it, and a Sources view of what the outline rests on. The
 * user's order and headings go back with the approval, and the article is
 * written in that order.
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
}: OutlineReviewProps) {
  const gate = useMemo(() => readOutlineGate(gateValue), [gateValue]);
  const isDraft = !outline;
  const editable = !isDraft && !isLoading;

  // The tree starts from what the gate offers, and again when it offers a new
  // outline (after a regeneration).
  const offeredKey = gate.sections
    .map((row) => `${row.id}=${row.heading}`)
    .join("|");
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

  const { data: personasData } = usePersonas(workspaceId || null);
  const personas = useMemo(() => personasData?.personas ?? [], [personasData]);
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

  const title = outline?.title ?? streamedField(rawTokens, "title");
  const brief = outline?.brief ?? streamedField(rawTokens, "brief");
  const sources = {
    serpResults: gate.serpResults,
    questions: gate.questions,
    relatedSearches: gate.relatedSearches,
    clusters: keywordClusters,
    clusterHeadings: outline?.cluster_heading_map,
  };
  const edited = rowsEdited(rows, gate.sections);

  const remove = (key: string) => {
    const { rows: next, removed } = removeRow(rows, key);
    if (!removed) return;
    setRows(next);
    toast(`Removed "${removed.heading}"`, {
      action: {
        label: "Undo",
        onClick: () => setRows((current) => restoreRow(current, removed.key)),
      },
    });
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
    <StreamingTree headings={streamedHeadings(rawTokens)} />
  ) : rows.length > 0 ? (
    <OutlineTree
      rows={rows}
      outline={outline}
      addableLists={gate.addableLists}
      editable={editable}
      onReorder={(list, listRows) =>
        setRows((current) => replaceList(current, list, listRows))
      }
      onMove={(key, offset) =>
        setRows((current) => moveRow(current, key, offset))
      }
      onRename={(key, heading) =>
        setRows((current) => renameRow(current, key, heading))
      }
      onRemove={remove}
      onAdd={(list, heading) =>
        setRows((current) => addRow(current, list, heading))
      }
    />
  ) : (
    <ReadOnlyBlocks blocks={readOnlyBlocks(outline)} />
  );

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

      <WithSidePane side={briefPane} sideTitle="Brief">
        <div className="space-y-6">
          <Tabs defaultValue="outline">
            <div className="flex items-center justify-between gap-2">
              <TabsList>
                <TabsTrigger value="outline">Outline</TabsTrigger>
                {hasSources(sources) && (
                  <TabsTrigger value="sources">Sources</TabsTrigger>
                )}
              </TabsList>
              {editable && edited && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRows(rowsFromGate(gate.sections))}
                >
                  <RotateCcw />
                  Reset sections
                </Button>
              )}
            </div>
            <TabsContent value="outline" className="mt-4">
              {treePane}
            </TabsContent>
            {hasSources(sources) && (
              <TabsContent value="sources" className="mt-4">
                <OutlineSources {...sources} />
              </TabsContent>
            )}
          </Tabs>

          <OutlineApproveBar
            disabled={isLoading || isDraft}
            onRegenerate={onReject}
            onApprove={approve}
          />
        </div>
      </WithSidePane>
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
