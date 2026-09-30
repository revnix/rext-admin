import type {
  Outline,
  ContentSection,
  OutlineRenderBlock,
  ClusterHeadingMapItem,
  KeywordCluster,
  InternalLinkSuggestion,
  BrandVoicePromotion,
  PersonaRecommendation,
} from "@/types/generate-content";
import type { Persona } from "@/types/workspace";
import { usePersonas } from "@/hooks/use-personas";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import {
  Check,
  X,
  Target,
  Mic2,
  Clock,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Pencil,
  Hash,
  Tag,
  FileText,
  HelpCircle,
  Layers,
  Link2,
  Megaphone,
  RefreshCw,
  UserCircle2,
} from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import type { WordCountRange } from "@/lib/generate-content/content-type-word-count";
const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

function extractJsonStringField(raw: string, field: string) {
  // Works even when JSON is incomplete; grabs the latest seen value.
  const re = new RegExp(
    `"${field}"\\s*:\\s*"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"`,
    "g",
  );
  let match = re.exec(raw);
  let last: string | null = null;
  while (match) {
    last = match[1] ?? null;
    match = re.exec(raw);
  }
  if (!last) return "";
  try {
    // Unescape JSON string value safely
    return JSON.parse(`"${last}"`);
  } catch {
    return last.replace(/\\"/g, '"');
  }
}

function extractJsonStringArrayField(raw: string, field: string) {
  // Best-effort parse for `"field": ["a","b"]` even while streaming.
  const re = new RegExp(`"${field}"\\s*:\\s*\\[([^\\]]*)`, "g");
  let match = re.exec(raw);
  let last: string | null = null;
  while (match) {
    last = match[1] ?? null;
    match = re.exec(raw);
  }
  if (!last) return [];

  const items = last.match(/"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"/g) ?? [];
  return items
    .map((s: string) => s.slice(1, -1))
    .map((s: string) => {
      try {
        return JSON.parse(`"${s}"`);
      } catch {
        return s.replace(/\\"/g, '"');
      }
    })
    .filter((s: unknown) => typeof s === "string" && s.trim().length > 0);
}

function MetadataSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border/50"
        >
          <Skeleton className="w-10 h-10 rounded-xl" />

          <div className="flex-1 space-y-2">
            <Skeleton className="w-20 h-3" />
            <Skeleton className="w-32 h-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="relative pl-12">
          {/* timeline dot */}
          <Skeleton className="absolute left-0 top-1 w-10 h-10 rounded-full" />

          <div className="p-5 rounded-xl border border-border/50 bg-card space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="w-40 h-5" />
              <Skeleton className="w-20 h-4" />
            </div>

            <Skeleton className="w-full h-4" />
            <Skeleton className="w-5/6 h-4" />

            <div className="grid grid-cols-2 gap-2 mt-2">
              <Skeleton className="h-3" />
              <Skeleton className="h-3" />
              <Skeleton className="h-3" />
              <Skeleton className="h-3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section content renderer (handles all content types) ────────────────────
function SectionContent({ section }: { section: ContentSection }) {
  const items: { label: string; content: string }[] = [];

  // key_points (most common — blog, pillar, etc.)
  if (section.key_points?.length) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {section.key_points.map((point: string) => (
          <div
            key={point}
            className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-card border border-transparent hover:border-border transition-all duration-200"
          >
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span className="text-sm font-medium text-muted-foreground">
              {point}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // checklist items
  if (section.items?.length) {
    return (
      <div className="space-y-2">
        {section.items.map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-transparent"
          >
            <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {item.label}
              </p>
              {item.context && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.context}
                </p>
              )}
              <span className="text-[10px] font-bold uppercase text-primary/60">
                {item.difficulty}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // FAQ items
  if (section.items_faq?.length) {
    return (
      <div className="space-y-3">
        {section.items_faq.map((faq) => (
          <div
            key={faq.question}
            className="p-3 rounded-xl bg-muted/50 border border-transparent"
          >
            <p className="text-sm font-semibold text-foreground">
              {faq.question}
            </p>
            {faq.answer_brief && (
              <p className="text-xs text-muted-foreground mt-1">
                {faq.answer_brief}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // glossary entries
  if (section.entries?.length) {
    return (
      <div className="space-y-2">
        {section.entries.map((entry) => (
          <div
            key={entry.term}
            className="p-3 rounded-xl bg-muted/50 border border-transparent"
          >
            <p className="text-sm font-bold text-foreground">{entry.term}</p>
            {entry.definition && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {entry.definition}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // resource list
  if (section.resources?.length) {
    return (
      <div className="space-y-2">
        {section.resources.map((res) => (
          <div
            key={res.title}
            className="p-3 rounded-xl bg-muted/50 border border-transparent"
          >
            <p className="text-sm font-semibold text-foreground">{res.title}</p>
            {res.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {res.description}
              </p>
            )}
            {res.category && (
              <span className="text-[10px] font-bold uppercase text-primary/60">
                {res.category}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  // tutorial steps
  if (section.steps?.length) {
    return (
      <div className="space-y-2">
        {section.steps.map((step, i) => (
          <div
            key={`step-${step.title}`}
            className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-transparent"
          >
            <span className="text-[11px] font-black text-primary mt-0.5 w-5 shrink-0">
              {i + 1}.
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // howto steps
  if (section.steps_howto?.length) {
    return (
      <div className="space-y-2">
        {section.steps_howto.map((step, i) => (
          <div
            key={`howto-${step.title}`}
            className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-transparent"
          >
            <span className="text-[11px] font-black text-primary mt-0.5 w-5 shrink-0">
              {i + 1}.
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              )}
              {step.tools_needed?.length ? (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Tools: {step.tools_needed.join(", ")}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // whitepaper findings
  if (section.findings?.length) {
    return (
      <div className="space-y-2">
        {section.findings.map((f) => (
          <div
            key={f.topic}
            className="p-3 rounded-xl bg-muted/50 border border-transparent"
          >
            <p className="text-sm font-semibold text-foreground">{f.topic}</p>
            {f.data_points?.length ? (
              <ul className="mt-1 space-y-0.5">
                {f.data_points.map((dp) => (
                  <li key={dp} className="text-xs text-muted-foreground">
                    • {dp}
                  </li>
                ))}
              </ul>
            ) : null}
            {f.implication && (
              <p className="text-xs text-primary/70 mt-1 italic">
                {f.implication}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // case study highlights / results
  if (section.key_highlights?.length || section.results?.length) {
    const highlights = section.key_highlights ?? [];
    const results = section.results ?? [];
    return (
      <div className="space-y-2">
        {highlights.map((h) => (
          <div
            key={h}
            className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-transparent"
          >
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span className="text-sm font-medium text-muted-foreground">
              {h}
            </span>
          </div>
        ))}
        {results.map((r) => (
          <div
            key={r.metric_name}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-transparent"
          >
            <span className="text-sm font-bold text-foreground">
              {r.metric_name}:
            </span>
            <span className="text-sm text-primary font-semibold">
              {r.result_value}
            </span>
            {r.context && (
              <span className="text-xs text-muted-foreground">
                ({r.context})
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  void items;
  return null;
}

function RenderBlocks({
  blocks,
  visibleSectionCount,
  sections,
}: {
  blocks: OutlineRenderBlock[];
  visibleSectionCount: number;
  sections?: ContentSection[];
}) {
  // Build heading → section lookup so we can augment block items with
  // word count, description and questions_to_answer from the raw outline.
  const sectionByHeading = useMemo(() => {
    if (!sections?.length) return new Map<string, ContentSection>();
    return new Map(sections.map((s) => [s.heading, s]));
  }, [sections]);

  let cumulativeStart = 0;
  const blockRanges = blocks.map((block) => {
    const start = cumulativeStart;
    cumulativeStart += block.items.length;
    return { block, start };
  });

  return (
    <div className="space-y-8">
      {blockRanges.map(({ block, start }) => {
        const visibleItems = block.items.slice(
          0,
          Math.max(0, visibleSectionCount - start),
        );
        if (!visibleItems.length) return null;
        return (
          <div key={block.heading}>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-3">
              {block.heading}
            </p>
            <div className="space-y-4 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-px before:bg-border/40">
              {visibleItems.map((item, j) => {
                const section = sectionByHeading.get(item.label);
                return (
                  <div key={item.label || j} className="relative pl-12 group">
                    <div className="absolute left-0 top-1 w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border/60 group-hover:border-primary/50 transition-colors z-10">
                      <span className="text-[11px] font-black text-muted-foreground/50 group-hover:text-primary transition-colors">
                        {String(start + j + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="p-5 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                      {/* Heading row with optional word-count badge */}
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        {item.label && (
                          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                            {item.label}
                          </h3>
                        )}
                        {section?.suggested_word_count && (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-[11px] font-bold text-muted-foreground">
                              ~{section.suggested_word_count} words
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Section description */}
                      {section?.description && (
                        <p className="text-[15px] text-muted-foreground leading-relaxed mb-4">
                          {section.description}
                        </p>
                      )}

                      {/* Questions to answer */}
                      {section?.questions_to_answer &&
                        section.questions_to_answer.length > 0 && (
                          <div className="mb-4">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5" /> Questions
                              to Answer
                            </p>
                            <div className="space-y-1.5">
                              {section.questions_to_answer.map((q: string) => (
                                <div
                                  key={q}
                                  className="flex items-start gap-2 text-sm text-muted-foreground"
                                >
                                  <span className="text-primary mt-0.5 shrink-0">
                                    •
                                  </span>
                                  <span>{q}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Points (key points / questions / tips) */}
                      {item.points.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {item.points.map((pt) => (
                            <div
                              key={pt}
                              className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-card border border-transparent hover:border-border transition-all duration-200"
                            >
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                              <span className="text-sm font-medium text-muted-foreground">
                                {pt}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function deriveOutlineFromTokens(rawTokens: string): Outline {
  // Best-effort: if we can parse a full object, use it; otherwise extract a few key fields.
  const start = rawTokens.indexOf("{");
  const end = rawTokens.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = rawTokens.slice(start, end + 1);
    try {
      const parsed = JSON.parse(candidate) as Partial<Outline>;
      if (parsed && typeof parsed === "object") {
        return {
          title: parsed.title,
          brief: parsed.brief,
          sections: Array.isArray(parsed.sections) ? parsed.sections : [],
          target_audience: Array.isArray(parsed.target_audience)
            ? parsed.target_audience
            : [],
          tone: typeof parsed.tone === "string" ? parsed.tone : "",
          keywords_to_include: Array.isArray(parsed.keywords_to_include)
            ? parsed.keywords_to_include
            : [],
          status: parsed.status === "rejected" ? "rejected" : "approved",
          rejected_reason:
            typeof parsed.rejected_reason === "string"
              ? parsed.rejected_reason
              : undefined,
          outline_retries:
            typeof parsed.outline_retries === "number"
              ? parsed.outline_retries
              : 0,
          draft_retries:
            typeof parsed.draft_retries === "number" ? parsed.draft_retries : 0,
          review_retries:
            typeof parsed.review_retries === "number"
              ? parsed.review_retries
              : 0,
          max_retries:
            typeof parsed.max_retries === "number" ? parsed.max_retries : 0,
          cluster_heading_map: Array.isArray(parsed.cluster_heading_map)
            ? parsed.cluster_heading_map
            : undefined,
        };
      }
    } catch {
      // ignore, fall back to regex extraction
    }
  }

  return {
    title: extractJsonStringField(rawTokens, "title") || undefined,
    brief: extractJsonStringField(rawTokens, "brief") || undefined,
    sections: [],
    target_audience: extractJsonStringArrayField(rawTokens, "target_audience"),
    tone: extractJsonStringField(rawTokens, "tone"),
    keywords_to_include: [],
    status: "approved",
    outline_retries: 0,
    draft_retries: 0,
    review_retries: 0,
    max_retries: 0,
  };
}

export function OutlineDisplay({
  outline,
  rawTokens, // ← NEW: the accumulating raw JSON string from messages/partial
  isLoading,
  internalLinks,
  brandVoicePromotion,
  workspaceId,
  onApprove,
  onReject,
  onUpdate,
  keywordClusters = [],
  pendingTargetWordCount,
}: {
  outline: Outline | null; // null while still streaming
  rawTokens: string; // grows token by token from SSE
  isLoading: boolean;
  internalLinks?: InternalLinkSuggestion[];
  brandVoicePromotion?: BrandVoicePromotion;
  workspaceId?: string | null;
  onApprove: (
    selectedLinks: InternalLinkSuggestion[],
    promoteBrand: boolean,
    selectedPersonaId: string | null,
  ) => void;
  onReject: () => void;
  onUpdate?: (outline: Outline) => void;
  keywordClusters?: KeywordCluster[];
  pendingTargetWordCount?: number | null;
}) {
  const [editingTone, setEditingTone] = useState(false);
  const [editingAudience, setEditingAudience] = useState(false);
  const [tone, setTone] = useState("");
  const [editingTargetWords, setEditingTargetWords] = useState(false);
  const [targetWordCount, setTargetWordCount] = useState("");
  const [audience, setAudience] = useState("");
  const [visibleSectionCount, setVisibleSectionCount] = useState(0);
  const [checkedUrls, setCheckedUrls] = useState<Set<string>>(new Set());
  const [promoteBrand, setPromoteBrand] = useState<boolean>(
    brandVoicePromotion?.recommended ?? false,
  );
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(
    null,
  );
  const [isPersonaSearchOpen, setIsPersonaSearchOpen] = useState(false);

  useEffect(() => {
    setPromoteBrand(brandVoicePromotion?.recommended ?? false);
  }, [brandVoicePromotion]);

  const { data: personasData } = usePersonas(workspaceId || null);
  const personas: Persona[] = useMemo(
    () => personasData?.personas ?? [],
    [personasData],
  );

  // The backend scores every persona against this outline's topic, title,
  // search intent and content type; the best fit seeds the selection below.
  const personaRecommendations: PersonaRecommendation[] = useMemo(
    () => outline?.persona_recommendations ?? [],
    [outline],
  );
  const recommendedPersonaId = personaRecommendations[0]?.persona_id ?? null;
  const personaScoreById = useMemo(() => {
    const scores = new Map<string, number>();
    for (const recommendation of personaRecommendations) {
      scores.set(recommendation.persona_id, recommendation.score);
    }
    return scores;
  }, [personaRecommendations]);

  // Adopt each recommendation exactly once. Tracking the recommendation the UI
  // has already applied — rather than re-deriving a selection on every render —
  // is what makes the choice stick: a cleared persona used to snap straight
  // back, and an unrelated edit (tone, audience, word count) replaces the
  // outline object, which must not undo the author the user picked.
  const appliedRecommendation = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!outline) return;
    const recommendation = outline.selected_persona_id ?? null;
    if (appliedRecommendation.current === recommendation) return;
    appliedRecommendation.current = recommendation;
    setSelectedPersonaId(recommendation);
  }, [outline]);

  const selectedPersona = useMemo(
    () =>
      personas.find(
        (persona) => (persona.id || persona.name) === selectedPersonaId,
      ) ?? null,
    [personas, selectedPersonaId],
  );
  const isDraft = !outline;
  const derivedOutline = useMemo(
    () => deriveOutlineFromTokens(rawTokens),
    [rawTokens],
  );
  const effectiveOutline = outline ?? derivedOutline;
  const canEdit = !!outline && !!onUpdate;
  const displayedTargetWordCount =
    pendingTargetWordCount ?? outline?.target_word_count;
  const isTargetWordCountPending =
    pendingTargetWordCount !== null && pendingTargetWordCount !== undefined;

  // Derive render blocks from cluster_heading_map + sections when _render is absent.
  const clusterBlocks = useMemo<OutlineRenderBlock[] | null>(() => {
    const map: ClusterHeadingMapItem[] | undefined =
      effectiveOutline.cluster_heading_map;
    if (!map || !Array.isArray(map) || !map.length) return null;
    const sectionByHeading = new Map(
      (effectiveOutline.sections ?? []).map((s) => [s.heading, s]),
    );
    const grouped = new Map<string, OutlineRenderBlock>();
    for (const { cluster, heading } of map) {
      if (!grouped.has(cluster))
        grouped.set(cluster, { heading: cluster, items: [] });
      const section = sectionByHeading.get(heading);
      grouped.get(cluster)?.items.push({
        label: heading,
        points: section?.key_points ?? [],
      });
    }
    return Array.from(grouped.values());
  }, [effectiveOutline.cluster_heading_map, effectiveOutline.sections]);

  useEffect(() => {
    if (!outline) return;

    setTone(outline.tone || "");
    setAudience(outline.target_audience?.join(", ") || "");
    setTargetWordCount(outline.target_word_count?.toString() || "");
  }, [outline]);

  // Progressive reveal when the *final* outline arrives — item by item.
  // Uses _render blocks (flattened item count) when available, sections otherwise.
  useEffect(() => {
    if (!outline) {
      setVisibleSectionCount(0);
      return;
    }

    const activeBlocks = outline._render?.blocks ?? clusterBlocks ?? null;
    const totalItems = activeBlocks
      ? activeBlocks.reduce((sum, b) => sum + b.items.length, 0)
      : (outline.sections?.length ?? 0);

    if (!totalItems) {
      setVisibleSectionCount(0);
      return;
    }

    let cancelled = false;

    const reveal = async () => {
      for (let i = 0; i < totalItems; i++) {
        if (cancelled) return;
        setVisibleSectionCount(i + 1);
        await wait(180);
      }
    };

    reveal();

    return () => {
      cancelled = true;
    };
  }, [outline, clusterBlocks]);

  const sortedInternalLinks = useMemo(
    () =>
      internalLinks ? [...internalLinks].sort((a, b) => b.score - a.score) : [],
    [internalLinks],
  );

  useEffect(() => {
    if (!sortedInternalLinks.length) return;
    setCheckedUrls(
      new Set(
        sortedInternalLinks.filter((l) => l.score >= 0.5).map((l) => l.url),
      ),
    );
  }, [sortedInternalLinks]);

  const handleToneSave = () => {
    if (onUpdate && outline) onUpdate({ ...outline, tone });
    setEditingTone(false);
  };

  const handleAudienceSave = () => {
    if (onUpdate && outline)
      onUpdate({
        ...outline,
        target_audience: audience
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
    setEditingAudience(false);
  };

  const handleTargetWordsSave = () => {
    if (!onUpdate || !outline) return;

    const count = Number(targetWordCount);

    onUpdate({
      ...outline,
      target_word_count: Number.isNaN(count) ? 0 : count,
    });

    setEditingTargetWords(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-3">
      {/* Header */}
      <div className="mb-10 space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight">
          {effectiveOutline.title}
        </h2>

        <p className="text-[15px] text-muted-foreground leading-relaxed max-w-3xl">
          {effectiveOutline.brief}
        </p>
      </div>

      {isDraft && isLoading && (
        <>
          <MetadataSkeleton />
          <SectionSkeleton />
        </>
      )}

      {/* Metadata Grid (show only after parsed outline arrives) */}
      {!isDraft && outline && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
          {/* Tone */}
          <div className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border/50">
            <div className="p-3 rounded-xl bg-card shadow-sm ring-1 ring-border">
              <Mic2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                Tone
              </p>
              {editingTone ? (
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <Input
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="h-7 text-sm min-w-[120px]"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={handleToneSave}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-slate-400 hover:text-slate-600"
                    onClick={() => {
                      setTone(outline.tone);
                      setEditingTone(false);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-700 dark:text-white">
                    {outline.tone}
                  </p>
                  {canEdit && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-slate-400 hover:text-blue-500"
                      onClick={() => setEditingTone(true)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Audience */}
          <div className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border/50">
            <div className="p-3 rounded-xl bg-card shadow-sm ring-1 ring-border">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                Audience
              </p>
              {editingAudience ? (
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <Input
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="h-7 text-sm min-w-[100px]"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-primary hover:bg-muted"
                    onClick={handleAudienceSave}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={() => {
                      setAudience(outline.target_audience?.join(", ") || "");
                      setEditingAudience(false);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p
                    className="text-sm font-bold text-foreground"
                    title={outline.target_audience?.join(", ") || ""}
                  >
                    {outline.target_audience?.join(", ") || ""}
                  </p>
                  {canEdit && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-primary"
                      onClick={() => setEditingAudience(true)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Focus Keyphrase */}
          {outline.focus_keyphrase && (
            <div className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border/50">
              <div className="p-3 rounded-xl bg-card shadow-sm ring-1 ring-border">
                <Hash className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                  Focus Keyphrase
                </p>
                <p className="text-sm font-bold text-foreground">
                  {outline.focus_keyphrase}
                </p>
              </div>
            </div>
          )}

          {/* Schema Type + Target Word Count */}
          {(outline.schema_type || displayedTargetWordCount) && (
            <div className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border/50">
              <div className="p-3 rounded-xl bg-card shadow-sm ring-1 ring-border">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-1 min-w-0 flex-wrap gap-x-8 gap-y-2">
                {outline.schema_type && (
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                      Schema
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {outline.schema_type}
                    </p>
                  </div>
                )}
                {displayedTargetWordCount && (
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                      Target Words
                    </p>

                    {editingTargetWords ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <Input
                          type="number"
                          min={0}
                          value={targetWordCount}
                          onChange={(e) => setTargetWordCount(e.target.value)}
                          className="h-7 w-28 text-sm min-w-0"
                        />

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-primary hover:bg-muted"
                          onClick={handleTargetWordsSave}
                        >
                          <Check className="w-4 h-4" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground"
                          onClick={() => {
                            setTargetWordCount(
                              outline.target_word_count?.toString() || "",
                            );
                            setEditingTargetWords(false);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">
                          {displayedTargetWordCount.toLocaleString()}
                        </p>

                        {isTargetWordCountPending ? (
                          <span className="text-[10px] font-semibold text-primary animate-pulse">
                            Applying feedback…
                          </span>
                        ) : canEdit ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                            onClick={() => {
                              setTargetWordCount(
                                outline.target_word_count?.toString() ?? "",
                              );
                              setEditingTargetWords(true);
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Keywords to include */}
          {outline.keywords_to_include &&
            outline.keywords_to_include.length > 0 && (
              <div className="col-span-full flex items-start gap-4 p-5 rounded-xl bg-card border border-border/50">
                <div className="p-3 rounded-xl bg-card shadow-sm ring-1 ring-border shrink-0">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Keywords to Include
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {outline.keywords_to_include.map((kw) => (
                      <span
                        key={kw}
                        className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted border border-border text-foreground"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
        </div>
      )}

      {/* Keyword Clusters & Topic Mapping */}
      {!isDraft && keywordClusters && keywordClusters.length > 0 && (
        <div className="mb-12 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">
              Keyword Clusters
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-5">
            {keywordClusters.map((cluster) => {
              return (
                <div
                  key={cluster.cluster_name}
                  className="flex flex-col p-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 shadow-sm"
                >
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        {cluster.cluster_name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {cluster.main_intent}
                        </span>
                        {cluster.confidence_score !== undefined && (
                          <span className="text-[10px] text-muted-foreground">
                            Conf: {Math.round(cluster.confidence_score * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-black text-muted-foreground/40 bg-muted px-2 py-1 rounded-md shrink-0">
                      {cluster.keywords.length} keywords
                    </span>
                  </div>

                  {/* Keywords */}
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {cluster.keywords.map((kw) => (
                      <span
                        key={kw.keyword}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted/60 border border-border/40 text-foreground/80"
                      >
                        {kw.keyword}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Structure — prefer _render blocks, fall back to cluster_heading_map, then legacy sections */}
      {!isDraft &&
      (effectiveOutline._render?.blocks?.length || clusterBlocks?.length) ? (
        <RenderBlocks
          blocks={effectiveOutline._render?.blocks ?? clusterBlocks ?? []}
          visibleSectionCount={visibleSectionCount}
          sections={outline?.sections}
        />
      ) : !isDraft && (effectiveOutline.sections?.length ?? 0) > 0 ? (
        <div className="space-y-4 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-px before:bg-border/40">
          {(effectiveOutline.sections ?? [])
            .slice(0, visibleSectionCount)
            .map((section, idx) => (
              <div
                key={section.heading || `section-${idx}`}
                className="relative pl-12 group"
              >
                <div className="absolute left-0 top-1 w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border/60 group-hover:border-primary/50 transition-colors z-10">
                  <span className="text-[11px] font-black text-muted-foreground/50 group-hover:text-primary transition-colors">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="p-5 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {section.heading}
                    </h3>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[11px] font-bold text-muted-foreground">
                        ~{section.suggested_word_count} words
                      </span>
                    </div>
                  </div>

                  <p className="text-[15px] text-muted-foreground leading-relaxed mb-4">
                    {section.description}
                  </p>

                  {section.questions_to_answer &&
                    section.questions_to_answer.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5" /> Questions to
                          Answer
                        </p>
                        <div className="space-y-1.5">
                          {section.questions_to_answer.map((q: string) => (
                            <div
                              key={q}
                              className="flex items-start gap-2 text-sm text-muted-foreground"
                            >
                              <span className="text-primary mt-0.5 shrink-0">
                                •
                              </span>
                              <span>{q}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <SectionContent section={section} />
                </div>
              </div>
            ))}
        </div>
      ) : null}

      {/* Internal Links Panel */}
      {sortedInternalLinks.length > 0 && (
        <div className="mt-8 p-5 rounded-xl border border-border/50 bg-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-card shadow-sm ring-1 ring-border">
              <Link2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Internal Links
              </p>
              <p className="text-xs text-muted-foreground">
                {checkedUrls.size} of {sortedInternalLinks.length} selected —
                links ≥ 50% relevance pre-selected
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {sortedInternalLinks.map((link) => {
              const isChecked = checkedUrls.has(link.url);
              return (
                <label
                  key={link.url}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border",
                    isChecked
                      ? "bg-primary/5 border-primary/30"
                      : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-border",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const next = new Set(checkedUrls);
                      if (e.target.checked) next.add(link.url);
                      else next.delete(link.url);
                      setCheckedUrls(next);
                    }}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors",
                      isChecked
                        ? "bg-primary border-primary"
                        : "bg-background border-border",
                    )}
                  >
                    {isChecked && (
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {link.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {link.url}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        link.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {link.status}
                    </span>
                    <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                      {Math.round(link.score * 100)}%
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Author Persona Panel */}
      {personas.length > 0 && (
        <div className="mt-8 p-5 rounded-xl border border-border/50 bg-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-card shadow-sm ring-1 ring-border">
              <UserCircle2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Author Persona
              </p>
              <p className="text-xs text-muted-foreground">
                Who this article is written as — recommended by fit with the
                topic, title, search intent and content type. Pick another, or
                clear it to write with no persona.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Popover
              open={isPersonaSearchOpen}
              onOpenChange={setIsPersonaSearchOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isPersonaSearchOpen}
                  className="w-full justify-between h-11 rounded-xl border-border/60 bg-muted/30 text-left px-3 hover:bg-muted/40"
                >
                  <div className="flex min-w-0 flex-col items-start overflow-hidden">
                    {/* No fallback to personas[0]: showing a persona the user
                        has not selected made a cleared selection unreadable. */}
                    <span
                      className={cn(
                        "truncate text-sm font-medium",
                        selectedPersona
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {selectedPersona
                        ? selectedPersona.full_name || selectedPersona.name
                        : "No author persona"}
                    </span>
                    {selectedPersona?.professional_title && (
                      <span className="truncate text-xs text-muted-foreground">
                        {selectedPersona.professional_title}
                      </span>
                    )}
                  </div>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0 border-border/60"
                align="start"
                style={{ width: "var(--radix-popover-trigger-width)" }}
              >
                <Command>
                  <CommandInput placeholder="Search personas..." />
                  <CommandList>
                    <CommandEmpty>No persona found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        key="__no_persona__"
                        value="No author persona"
                        onSelect={() => {
                          setSelectedPersonaId(null);
                          setIsPersonaSearchOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedPersonaId === null
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <span className="font-medium text-muted-foreground">
                          No author persona
                        </span>
                      </CommandItem>
                      {personas.map((persona) => {
                        const id = persona.id || persona.name;
                        const displayName = persona.full_name || persona.name;
                        const isSelected = selectedPersonaId === id;
                        const score = personaScoreById.get(id);

                        return (
                          <CommandItem
                            key={id}
                            value={`${displayName} ${persona.professional_title ?? ""} ${persona.name}`}
                            onSelect={() => {
                              // Selecting the selected persona clears it, so the
                              // same control that picks an author can drop one.
                              setSelectedPersonaId(isSelected ? null : id);
                              setIsPersonaSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                isSelected ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <div className="flex min-w-0 flex-1 flex-col items-start">
                              <span className="font-medium">{displayName}</span>
                              {persona.professional_title && (
                                <span className="text-xs text-muted-foreground">
                                  {persona.professional_title}
                                </span>
                              )}
                            </div>
                            <div className="ml-2 flex shrink-0 items-center gap-1.5">
                              {id === recommendedPersonaId && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  Recommended
                                </span>
                              )}
                              {score !== undefined && (
                                <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                                  {Math.round(score)}% fit
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Brand Voice Promotion Panel */}
      {brandVoicePromotion && (
        <div className="mt-6 p-5 rounded-xl border border-border/50 bg-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-card shadow-sm ring-1 ring-border">
              <Megaphone className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Brand Promotion
              </p>
              <p className="text-xs text-muted-foreground">
                Naturally mention{" "}
                <span className="font-semibold text-foreground">
                  {brandVoicePromotion.brand_name}
                </span>{" "}
                in the content
                {brandVoicePromotion.brand_url && (
                  <>
                    {" "}
                    — linked to{" "}
                    <span className="font-medium text-foreground/80">
                      {brandVoicePromotion.brand_url}
                    </span>
                  </>
                )}
              </p>
            </div>
            {brandVoicePromotion.recommended && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                Recommended
              </span>
            )}
            <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-primary/10 text-primary shrink-0">
              {Math.round(brandVoicePromotion.score * 100)}% match
            </span>
          </div>

          {(brandVoicePromotion.about ||
            brandVoicePromotion.selling_position) && (
            <div className="mb-4 space-y-1.5 pl-1">
              {brandVoicePromotion.about && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  <span className="font-semibold text-foreground/70">
                    About:{" "}
                  </span>
                  {brandVoicePromotion.about}
                </p>
              )}
              {brandVoicePromotion.selling_position && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  <span className="font-semibold text-foreground/70">
                    Position:{" "}
                  </span>
                  {brandVoicePromotion.selling_position}
                </p>
              )}
            </div>
          )}

          <label
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border",
              promoteBrand
                ? "bg-primary/5 border-primary/30"
                : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-border",
            )}
          >
            <input
              type="checkbox"
              checked={promoteBrand}
              onChange={(e) => setPromoteBrand(e.target.checked)}
              className="sr-only"
            />
            <div
              className={cn(
                "w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors",
                promoteBrand
                  ? "bg-primary border-primary"
                  : "bg-background border-border",
              )}
            >
              {promoteBrand && (
                <Check className="w-2.5 h-2.5 text-primary-foreground" />
              )}
            </div>
            <p className="text-sm font-medium text-foreground">
              Include brand mention in generated content
            </p>
          </label>
        </div>
      )}

      {/* Action Bar */}
      <div className="mt-10 flex items-center justify-end gap-3">
        <Button
          onClick={onReject}
          disabled={isLoading || isDraft}
          variant="outline"
          className="h-11 px-7 rounded-xl border-border/60 text-muted-foreground hover:bg-accent/30 hover:text-foreground transition-all"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
        </Button>
        <Button
          onClick={() => {
            const selected = sortedInternalLinks.filter((l) =>
              checkedUrls.has(l.url),
            );
            onApprove(selected, promoteBrand, selectedPersonaId);
          }}
          disabled={isLoading || isDraft}
          className="h-11 px-8 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/15"
        >
          <Check className="w-4 h-4" /> Approve & Generate
        </Button>
      </div>
    </div>
  );
}

// ─── OutlineRejectSection — unchanged ────────────────────────────────────────
export function OutlineRejectSection({
  instruction,
  rejectedReason,
  contentType,
  wordCountRange,
  onChange,
  onSubmit,
}: {
  instruction: string;
  rejectedReason: string;
  contentType?: string;
  wordCountRange?: WordCountRange | null;
  onChange: (val: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="w-full max-w-2xl mx-auto py-3">
      <div className="p-7 rounded-2xl bg-card border border-border/50">
        <div className="flex items-center gap-4 mb-7">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black text-primary/60 tracking-[0.2em] uppercase mb-0.5">
              Feedback
            </p>
            <h3 className="text-[15px] font-bold text-foreground leading-tight">
              {instruction}
            </h3>
          </div>
        </div>
        <Textarea
          value={rejectedReason}
          onChange={(e) => onChange(e.target.value)}
          placeholder={instruction}
          className="w-full min-h-[140px] p-4 rounded-xl border-border/50 focus:border-primary/50 text-foreground bg-muted/30 text-[14px] leading-relaxed"
        />
        {wordCountRange && (
          <p className="mt-3 text-xs text-muted-foreground">
            {contentType || "This content type"} supports between{" "}
            {wordCountRange.min.toLocaleString()} and{" "}
            {wordCountRange.max.toLocaleString()} words.
          </p>
        )}
        <div className="flex items-center justify-end mt-6">
          <Button
            onClick={onSubmit}
            className="h-11 px-8 rounded-xl font-semibold gap-1.5 group"
          >
            Submit Feedback
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}
