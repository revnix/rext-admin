import type { Outline, ContentSection } from "@/types/generate-content";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Target,
  Mic2,
  Clock,
  ChevronRight,
  ListChecks,
  MessageSquare,
  Pencil,
  Hash,
  Tag,
  FileText,
  HelpCircle,
} from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { Input } from "../ui/input";
import { useTypewriter } from "@/hooks/use-typewriter";

// ─── Blinking cursor ──────────────────────────────────────────────────────────
// Add to globals.css:
//   @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
//   .tw-cursor { animation: blink 0.85s step-end infinite; }

function Cursor() {
  return <span className="tw-cursor inline-block ml-px text-primary">▋</span>;
}

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

// ─── Section content renderer (handles all content types) ────────────────────
function SectionContent({ section }: { section: ContentSection }) {
  const items: { label: string; content: string }[] = [];

  // key_points (most common — blog, pillar, etc.)
  if (section.key_points?.length) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {section.key_points.map((point: string, pIdx: number) => (
          <motion.div
            key={point}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 + pIdx * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-card border border-transparent hover:border-border transition-all duration-200"
          >
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span className="text-sm font-medium text-muted-foreground">
              {point}
            </span>
          </motion.div>
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
            key={`step-${step.title}-${i}`}
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
            key={`howto-${step.title}-${i}`}
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

// ─── Single field with typewriter ────────────────────────────────────────────
function TypeField({
  text,
  speed = 45,
  retypeOnChange = false,
}: {
  text: string;
  speed?: number;
  retypeOnChange?: boolean;
}) {
  const { displayed, isDone } = useTypewriter(text, {
    speed,
    retypeOnChange,
  });
  return (
    <>
      {displayed}
      {!isDone && <Cursor />}
    </>
  );
}

export function OutlineDisplay({
  outline,
  rawTokens, // ← NEW: the accumulating raw JSON string from messages/partial
  isLoading,
  onApprove,
  onReject,
  onUpdate,
}: {
  outline: Outline | null; // null while still streaming
  rawTokens: string; // grows token by token from SSE
  isLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
  onUpdate?: (outline: Outline) => void;
}) {
  const [editingTone, setEditingTone] = useState(false);
  const [editingAudience, setEditingAudience] = useState(false);
  const [tone, setTone] = useState("");
  const [audience, setAudience] = useState("");
  const [visibleSectionCount, setVisibleSectionCount] = useState(0);
  const [_visiblePointsBySection, setVisiblePointsBySection] = useState<
    Record<number, number>
  >({});

  const isDraft = !outline;
  const derivedOutline = useMemo(
    () => deriveOutlineFromTokens(rawTokens),
    [rawTokens],
  );
  const effectiveOutline = outline ?? derivedOutline;
  const canEdit = !!outline && !!onUpdate;

  // Header typing completion gates the section reveal for a smoother "one-by-one"
  const titleTw = useTypewriter(effectiveOutline.title ?? "", {
    speed: 55,
    // ChatGPT style: never restart; keep typing forward as text grows
    retypeOnChange: false,
  });
  const briefTw = useTypewriter(effectiveOutline.brief ?? "", {
    speed: 50,
    retypeOnChange: false,
  });
  const headerDone = !isDraft && titleTw.isDone && briefTw.isDone;

  const startedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (outline) {
      setTone(outline.tone);
      setAudience(outline.target_audience?.join(", ") || "");
      // Reset started set when a fresh outline arrives
      startedRef.current = new Set();
    }
  }, [outline]); // only reset when a genuinely new outline arrives

  // Progressive reveal when the *final* outline arrives:
  // - show section cards one-by-one
  // - in the currently revealing section, show key points one-by-one
  useEffect(() => {
    if (!outline || outline.sections.length === 0) {
      setVisibleSectionCount(0);
      setVisiblePointsBySection({});
      return;
    }
    // Wait until title + brief have typed in before we start revealing sections.
    if (!headerDone) {
      setVisibleSectionCount(0);
      setVisiblePointsBySection({});
      return;
    }

    let cancelled = false;
    const timeouts: number[] = [];

    setVisibleSectionCount(0);
    setVisiblePointsBySection({});

    const revealSection = (idx: number) => {
      if (cancelled) return;
      setVisibleSectionCount((prev) => Math.max(prev, idx + 1));

      // Reveal points for this section progressively
      const points = outline.sections[idx]?.key_points ?? [];
      if (points.length > 0) {
        setVisiblePointsBySection((prev) => ({ ...prev, [idx]: 0 }));
        for (let p = 0; p < points.length; p++) {
          timeouts.push(
            window.setTimeout(
              () => {
                if (cancelled) return;
                setVisiblePointsBySection((prev) => ({
                  ...prev,
                  [idx]: Math.max(prev[idx] ?? 0, p + 1),
                }));
              },
              350 + p * 220,
            ),
          );
        }
      } else {
        setVisiblePointsBySection((prev) => ({ ...prev, [idx]: 0 }));
      }

      // Schedule next section after some time.
      const nextDelay = 900 + Math.min(points.length, 6) * 220;
      if (idx + 1 < outline.sections.length) {
        timeouts.push(
          window.setTimeout(() => revealSection(idx + 1), nextDelay),
        );
      }
    };

    timeouts.push(window.setTimeout(() => revealSection(0), 250));

    return () => {
      cancelled = true;
      timeouts.forEach((t) => {
        window.clearTimeout(t);
      });
    };
  }, [outline, headerDone]);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-4xl mx-auto py-8"
    >
      {/* Header */}
      <div className="mb-10 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <p className="text-[10px] font-black text-primary/60 tracking-[0.2em] uppercase">
            Step 05 — Content Outline
          </p>
          {isDraft && (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50 ml-2">
              <ListChecks className="w-3.5 h-3.5 animate-pulse" />
              Generating…
            </span>
          )}
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight">
          {titleTw.displayed}
          {!titleTw.isDone && <Cursor />}
        </h2>

        <p className="text-[15px] text-muted-foreground leading-relaxed max-w-3xl">
          {briefTw.displayed}
          {!briefTw.isDone && <Cursor />}
        </p>
      </div>

      {/* Metadata Grid (show only after parsed outline arrives) */}
      {outline && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
          {/* Tone */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border/50"
          >
            <div className="p-3 rounded-xl bg-card shadow-sm ring-1 ring-border">
              <Mic2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                Tone
              </p>
              {editingTone ? (
                <div className="flex items-center gap-2">
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
                    <TypeField
                      text={outline.tone}
                      speed={60}
                      retypeOnChange={false}
                    />
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
          </motion.div>

          {/* Audience */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border/50"
          >
            <div className="p-3 rounded-xl bg-card shadow-sm ring-1 ring-border">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                Audience
              </p>
              {editingAudience ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="h-7 text-sm min-w-[200px]"
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
                  <p className="text-sm font-bold text-foreground truncate max-w-[200px]">
                    <TypeField
                      text={outline.target_audience?.join(", ") || ""}
                      speed={55}
                      retypeOnChange={false}
                    />
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
          </motion.div>

          {/* Focus Keyphrase */}
          {outline.focus_keyphrase && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border/50"
            >
              <div className="p-3 rounded-xl bg-card shadow-sm ring-1 ring-border">
                <Hash className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                  Focus Keyphrase
                </p>
                <p className="text-sm font-bold text-foreground">
                  <TypeField
                    text={outline.focus_keyphrase}
                    speed={55}
                    retypeOnChange={false}
                  />
                </p>
              </div>
            </motion.div>
          )}

          {/* Schema Type + Target Word Count */}
          {(outline.schema_type || outline.target_word_count) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
              className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border/50"
            >
              <div className="p-3 rounded-xl bg-card shadow-sm ring-1 ring-border">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex gap-8">
                {outline.schema_type && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                      Schema
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {outline.schema_type}
                    </p>
                  </div>
                )}
                {outline.target_word_count && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                      Target Words
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {outline.target_word_count.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Keywords to include */}
          {outline.keywords_to_include &&
            outline.keywords_to_include.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="col-span-full flex items-start gap-4 p-5 rounded-xl bg-card border border-border/50"
              >
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
              </motion.div>
            )}
        </div>
      )}

      {/* Sections — each section staggers in and types its own fields */}
      <div className="space-y-4 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-px before:bg-border/40">
        {(effectiveOutline.sections?.length ?? 0) > 0
          ? (effectiveOutline.sections ?? [])
              .slice(
                0,
                outline
                  ? visibleSectionCount
                  : (effectiveOutline.sections?.length ?? 0),
              )
              .map((section, idx) => (
                <motion.div
                  key={section.heading || `section-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.12 }}
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
                        <TypeField
                          text={section.heading}
                          speed={55}
                          retypeOnChange={false}
                        />
                      </h3>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[11px] font-bold text-muted-foreground">
                          ~{section.suggested_word_count} words
                        </span>
                      </div>
                    </div>

                    <p className="text-[15px] text-muted-foreground leading-relaxed mb-4">
                      <TypeField
                        text={section.description}
                        speed={48}
                        retypeOnChange={false}
                      />
                    </p>

                    {/* questions_to_answer */}
                    {section.questions_to_answer &&
                      section.questions_to_answer.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5" /> Questions to
                            Answer
                          </p>
                          <div className="space-y-1.5">
                            {section.questions_to_answer.map(
                              (q: string) => (
                                <div
                                  key={q}
                                  className="flex items-start gap-2 text-sm text-muted-foreground"
                                >
                                  <span className="text-primary mt-0.5 shrink-0">
                                    •
                                  </span>
                                  <span>{q}</span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {/* Section-type specific content */}
                    <SectionContent section={section} />
                  </div>
                </motion.div>
              ))
          : null}
      </div>

      {/* Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3 + (effectiveOutline.sections?.length ?? 0) * 0.12,
        }}
        className="mt-10 flex items-center justify-end gap-3"
      >
        <Button
          onClick={onReject}
          disabled={isLoading || isDraft}
          variant="outline"
          className="h-11 px-7 rounded-xl border-border/60 text-muted-foreground hover:bg-accent/30 hover:text-foreground transition-all"
        >
          <X className="w-4 h-4 mr-2" /> Reject
        </Button>
        <Button
          onClick={onApprove}
          disabled={isLoading || isDraft}
          className="h-11 px-8 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/15"
        >
          <Check className="w-4 h-4" /> Approve & Generate
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ─── OutlineRejectSection — unchanged ────────────────────────────────────────
export function OutlineRejectSection({
  instruction,
  rejectedReason,
  onChange,
  onSubmit,
}: {
  instruction: string;
  rejectedReason: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto py-12"
    >
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
    </motion.div>
  );
}
