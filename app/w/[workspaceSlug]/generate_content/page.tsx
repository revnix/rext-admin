"use client";

import { PageLayout } from "@/components/page-layout";
import { useWorkspace } from "@/providers/workspace-provider";
import { workspaceRoutes } from "@/lib/routes";
import { useEffect, useState, isValidElement, type ReactNode } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { log } from "@/lib/logger";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChartRadialStacked } from "@/components/ui/content/chart-radial-stacked";
import { SearchIntentCard } from "@/components/ui/content/intent-card";
import {
  Search,
  Compass,
  TrendingUp,
  Zap,
  Save,
  Send,
  Activity,
  Eye,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MonthlyVolumeCard } from "@/components/ui/content/monthly-volume-card";
import { LoadingIndicatorVariants } from "@/components/ui/content/loading-indicator-variants";
import type { Outline, ReadabilityMeta, WREXT } from "@/types/generate-content";
import { CountryDropdown } from "@/components/ui/country-dropdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Textarea } from "@/components/ui/textarea";

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

const getTextFromChildren = (children: ReactNode): string => {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(getTextFromChildren).join("");
  }
  if (isValidElement<{ children?: ReactNode }>(children)) {
    return getTextFromChildren(children.props.children);
  }
  return "";
};

function getReadabilityMeta(score: number): ReadabilityMeta {
  if (score >= 90) {
    return {
      label: "Very Easy",
      color: "text-emerald-600",
      barColor: "bg-emerald-500",
    };
  }

  if (score >= 80) {
    return {
      label: "Easy",
      color: "text-emerald-600",
      barColor: "bg-emerald-500",
    };
  }

  if (score >= 70) {
    return {
      label: "Fairly Easy",
      color: "text-emerald-600",
      barColor: "bg-emerald-500",
    };
  }

  if (score >= 60) {
    return {
      label: "Standard",
      color: "text-emerald-600",
      barColor: "bg-emerald-500",
    };
  }

  if (score >= 50) {
    return {
      label: "Fairly Difficult",
      color: "text-yellow-600",
      barColor: "bg-yellow-500",
    };
  }

  if (score >= 30) {
    return {
      label: "Difficult",
      color: "text-orange-600",
      barColor: "bg-orange-500",
    };
  }

  return {
    label: "Very Confusing",
    color: "text-red-600",
    barColor: "bg-red-500",
  };
}

export default function Page() {
  const { workspace, workspaceSlug } = useWorkspace();
  const [step, setStep] = useState<
    | "keyword"
    | "suggestions"
    | "topic"
    | "outline"
    | "outline-reject"
    | "content"
  >("keyword");
  const [userKeyword, setUserKeyword] = useState("");
  const [country, setCountry] = useState("us");
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [rejectedReason, setRejectedReason] = useState("");
  const [outline, setOutline] = useState<Outline | null>(null);
  const [instruction, setInstruction] = useState<string>("");
  const [instructionType, setInstructionType] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Generate Content" },
  ];

  const { values, submit, isLoading } = useStream<WREXT>({
    apiUrl: "http://192.168.1.130:2024/",
    assistantId: "agent",
    messagesKey: "messages",
    threadId: threadId,
    onThreadId: setThreadId,
  });

  // Track all state changes from stream
  useEffect(() => {
    if (!values) return;

    // Update UI based on streamed values with strict Priority
    const interrupt = values.__interrupt__?.[0];

    if (interrupt) {
      setInstruction(interrupt?.value.instructions);
      setInstructionType(interrupt?.value.type);
    }

    // 1. Content Phase (Dominant)
    if (values.content?.final_content) {
      if (values.content?.final_content?.body_markdown) {
        // Only update if we don't have content yet or if we're not in editing mode
        setGeneratedContent((prev) => {
          if (!prev || !isEditing)
            return values.content?.final_content?.body_markdown;
          return prev;
        });
      }
      if (step !== "content") setStep("content");
    }

    // 2. Outline Review Phase
    else if (interrupt?.value.type === "outline_review") {
      setOutline(interrupt?.value.data as Outline);
      if (step !== "outline" && step !== "outline-reject" && step !== "content")
        setStep("content");
    }

    // 3. Selection Phase
    else {
      const keywords = interrupt?.value["Related Keywords"];
      if (keywords && keywords.length > 0) {
        setSuggestedKeywords(keywords);
        if (step === "keyword") setStep("suggestions");
      }
    }
  }, [values, step, isEditing]);

  // Step 1: Submit user keyword -> get suggestions
  const handleKeywordSubmit = () => {
    log.info("[User Action: Submit Keyword]", userKeyword, country);
    submit({
      serp_payload: {
        query: userKeyword,
        country: country,
      },
      messages: [
        {
          type: "human",
          content: `Suggest 5 keywords related to: ${userKeyword}`,
        },
      ],
    });
    setStep("suggestions");
  };

  // Step 2: Select keyword → get outline
  const handleKeywordSelect = (selected: string) => {
    log.info("[User Action: Select Keyword]", selected);
    setStep("outline");

    const interrupt = values.__interrupt__?.[0];
    // Preserve interrupt state + add selection, then RESUME with command
    submit(
      {
        // User input + preserved state
        "Primary Keyword": selected,
        "Related Keywords": interrupt?.value["Related Keywords"] || [],
        instruction_response: selected,
        continue_workflow: true,
      },
      {
        // CRITICAL: Use command.resume to resume from interrupt
        command: { resume: true },
      },
    );
  };

  // Step 3: Approve outline → get content
  const handleOutlineApprove = () => {
    // Use null to avoid trying to update state keys, preventing InvalidUpdateError
    setStep("content");
    submit(null, {
      command: { resume: "approve" },
    });
  };

  const handleOutlineReject = () => {
    setInstruction("");
    setStep("outline-reject");
    submit(null, {
      command: { resume: "reject" },
    });
  };

  const handleOutlineRejectReason = () => {
    setStep("outline");
    setRejectedReason("");
    setOutline(null);
    submit(
      {
        instruction_response: rejectedReason,
        continue_workflow: true,
      },
      {
        command: { resume: true },
      },
    );
  };

  useEffect(() => {
    if (values) {
      log.info("values", values);
    }
  }, [values]);

  return (
    <PageLayout
      title="Generate Content"
      hideTitle={true}
      description={`View, edit, and manage AI-generated content for ${workspace?.title || "this workspace"}.`}
      breadcrumbs={breadcrumbs}
    >
      <div
        className={`max-w-3xl mx-auto w-full flex flex-col items-center relative px-6 overflow-hidden transition-all duration-700 ${step === "keyword" ? "min-h-[70vh] justify-center" : "min-h-0 pt-2"}`}
      >
        <AnimatePresence mode="wait">
          {step === "keyword" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-10"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                What are we <span className="text-primary">writing</span> today?
              </h1>
              <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
                Transform your keywords into high-quality content with our
                AI-powered generation engine.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full"
        >
          {(step === "keyword" || step === "suggestions") && (
            <div className="relative group">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleKeywordSubmit();
                }}
                className="relative flex flex-col sm:flex-row gap-3 py-2 bg-white/80 border border-slate-200 rounded-xl shadow-2xl shadow-slate-200/50"
              >
                <div className="flex-1 flex items-center px-4">
                  <Search className="w-6 h-6 text-slate-300 mr-4" />
                  <Input
                    type="text"
                    placeholder="Enter a keyword or topic..."
                    className="h-12 w-full border-none shadow-none !text-lg !placeholder:text-slate-300 focus-visible:ring-0 bg-transparent px-0"
                    value={userKeyword}
                    onChange={(e) => setUserKeyword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center gap-2 px-2 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 group/actions">
                  <CountryDropdown
                    slim={true}
                    value={country}
                    onChange={(c) => setCountry(c.alpha2)}
                  />
                  <Button
                    type="submit"
                    className="h-12 px-4 text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Generate
                  </Button>
                </div>
              </form>
            </div>
          )}
        </motion.div>

        <LoadingIndicatorVariants
          step={step}
          isLoading={isLoading}
          className="mt-5"
        />

        {step === "suggestions" && suggestedKeywords.length > 0 && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 mt-4 gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-400">
                    Difficulty
                  </span>
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <ChartRadialStacked difficultyScore={54} />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="bg-white border border-gray-200 rounded-xl p-4 h-full flex flex-col justify-between transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-400">
                      Search Intent
                    </span>
                    <Compass className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex items-center gap-3">
                    <SearchIntentCard intent="informational" />
                  </div>
                </div>
                <div
                  className={`bg-white border border-gray-200 rounded-xl p-4 h-full flex flex-col justify-between transition-all`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-400">
                      Monthly Volume
                    </span>
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                  <MonthlyVolumeCard volume="0" />
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold my-4">{instruction}</h2>
            <div className="flex flex-wrap gap-2">
              {suggestedKeywords.map((kw) => (
                <Button
                  key={kw}
                  variant="outline"
                  onClick={() => handleKeywordSelect(kw)}
                  className="bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-all ease-in-out duration-300"
                >
                  <strong>{kw}</strong>
                </Button>
              ))}
            </div>
          </div>
        )}

        {step === "outline" && outline && (
          <div className="animate-in fade-in duration-500 mt-8">
            <div className="space-y-2">
              <div className="space-y-2">
                <h2 className="text-xl font-bold leading-tight">
                  {outline.title}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {outline.brief}
                </p>
              </div>

              <div className="pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    Tone:
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    {outline.tone}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    Audience:
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    {outline.target_audience?.join(", ")}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {outline.sections.map((section, idx) => (
                <div key={section.heading} className="relative">
                  <div className="flex items-baseline gap-4">
                    <h3 className="text-sm font-bold">
                      <span className="mr-4 font-mono">{idx + 1}.</span>
                      {section.heading}
                    </h3>
                    <div className="text-xs bg-slate-100 rounded-full px-1 py-px font-medium text-slate-400">
                      ~{section.suggested_word_count} words
                    </div>
                  </div>
                  <div className="pl-10">
                    <p className="leading-relaxed">{section.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ul className="space-y-1">
                        {section.key_points.map((point: string) => (
                          <li
                            key={point}
                            className="flex items-start gap-2 text-sm text-slate-600 pl-2"
                          >
                            <span className="mt-2 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 mt-8">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto ms-auto">
                <Button onClick={handleOutlineApprove} disabled={isLoading}>
                  Approve & Generate
                </Button>
                <Button
                  onClick={handleOutlineReject}
                  disabled={isLoading}
                  variant="outline"
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "outline-reject" && instructionType === "outline_reject" && (
          <div className="animate-in fade-in duration-700 bg-white flex flex-col w-full">
            <label htmlFor="rejectedReason" className="text-base font-medium">
              {instruction}
            </label>
            <Textarea
              name="rejectedReason"
              id="rejectedReason"
              value={rejectedReason}
              onChange={(e) => setRejectedReason(e.target.value)}
              placeholder={instruction}
              className="w-full mt-2"
            />
            <div className="flex justify-end mt-2">
              <Button onClick={() => handleOutlineRejectReason()}>
                Submit
              </Button>
            </div>
          </div>
        )}
      </div>

      {step === "content" && values.content?.final_content && (
        <div className="animate-in fade-in duration-700 bg-white flex flex-col -mt-10">
          {(() => {
            const fc = values.content?.final_content;
            const displayTitle =
              fc?.title || userKeyword || "New Content Piece";
            const body = generatedContent;
            const tags = fc?.tags || [];
            const score =
              values.content?.review?.readability_metrics
                ?.flesch_reading_ease ?? 0;

            const { label, color, barColor } = getReadabilityMeta(score);

            const progressWidth = `${Math.round(Math.min(Math.max(score, 0), 100))}%`;
            return (
              <div className="flex flex-1 overflow-hidden relative border-b">
                {/* Left Sidebar: Outline */}
                <aside className="hidden lg:flex w-48 border-r bg-slate-50/50 flex-col py-6 sticky top-0">
                  <div className="px-4 mb-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
                      Structure
                    </h3>
                    {outline?.sections.map((sec, i) => (
                      <button
                        type="button"
                        key={sec.heading}
                        onClick={() => {
                          const id = slugify(sec.heading);
                          const element = document.getElementById(id);
                          if (element) {
                            element.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }
                        }}
                        className="w-full flex items-center gap-3 px-1 py-1 text-sm text-left cursor-pointer hover:bg-slate-100 rounded-sm"
                      >
                        <span className="text-sm font-mono text-slate-300">
                          {i + 1}
                        </span>
                        <span className="truncate">{sec.heading}</span>
                      </button>
                    ))}
                  </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-white px-2 py-4">
                  <article className="max-w-3xl mx-5">
                    <div className="prose prose-slate prose-lg max-w-none">
                      {isEditing ? (
                        <>
                          <h1 className="text-lg font-bold truncate">
                            {displayTitle}
                          </h1>
                          <textarea
                            value={body}
                            onChange={(e) =>
                              setGeneratedContent(e.target.value)
                            }
                            className="mt-2 w-full min-h-[600px] p-6 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none interface-edit transition-all"
                            placeholder="Start writing..."
                          />
                        </>
                      ) : (
                        <div className="w-full">
                          {body ? (
                            <>
                              <div className="space-y-4 mt-2">
                                <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                  {tags.map((t) => (
                                    <span key={t}>#{t}</span>
                                  ))}
                                </div>
                              </div>
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({ children, ...props }) => (
                                    <h1
                                      id={slugify(
                                        getTextFromChildren(children),
                                      )}
                                      className="text-4xl font-bold mt-2 mb-6 tracking-tight leading-tight"
                                      {...props}
                                    >
                                      {children}
                                    </h1>
                                  ),
                                  h2: ({ children, ...props }) => (
                                    <h2
                                      id={slugify(
                                        getTextFromChildren(children),
                                      )}
                                      className="text-3xl font-bold mt-10 mb-4 tracking-tight"
                                      {...props}
                                    >
                                      {children}
                                    </h2>
                                  ),
                                  h3: ({ children, ...props }) => (
                                    <h3
                                      id={slugify(
                                        getTextFromChildren(children),
                                      )}
                                      className="text-2xl font-bold mt-8 mb-3"
                                      {...props}
                                    >
                                      {children}
                                    </h3>
                                  ),
                                  p: ({ ...props }) => (
                                    <p
                                      className="text-lg text-slate-600 leading-[1.8] mb-6"
                                      {...props}
                                    />
                                  ),
                                  ul: ({ ...props }) => (
                                    <ul
                                      className="list-disc list-inside space-y-3 mb-6 text-slate-600"
                                      {...props}
                                    />
                                  ),
                                  ol: ({ ...props }) => (
                                    <ol
                                      className="list-decimal list-inside space-y-3 mb-6 text-slate-600"
                                      {...props}
                                    />
                                  ),
                                  li: ({ ...props }) => (
                                    <li
                                      className="pl-2 leading-relaxed"
                                      {...props}
                                    />
                                  ),
                                  strong: ({ ...props }) => (
                                    <strong className="font-bold" {...props} />
                                  ),
                                }}
                              >
                                {body}
                              </ReactMarkdown>
                            </>
                          ) : (
                            <div className="space-y-4 animate-pulse">
                              <div className="h-4 bg-slate-100 rounded w-full" />
                              <div className="h-4 bg-slate-100 rounded w-5/6" />
                              <div className="h-4 bg-slate-100 rounded w-4/6" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                </main>

                {/* Right Sidebar: Analysis */}
                <aside className="hidden xl:flex w-64 border-l bg-slate-50/30 flex-col px-4 py-3 space-y-8 overflow-y-auto">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-9 !px-1 text-xs font-bold transition-all`}
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? <Eye size={14} /> : <Pencil size={14} />}{" "}
                      {isEditing ? "Preview" : "Edit"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 !px-1 text-xs font-bold text-slate-500 hover:bg-slate-50"
                    >
                      <Save size={14} /> Save
                    </Button>
                    <Button size="sm" className="h-9 px-4 text-xs font-bold">
                      <Send size={14} className="mr-2" /> Publish
                    </Button>
                  </div>
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 font-bold">
                      <Activity size={16} className="text-emerald-500" />
                      <h4 className="text-xs uppercase tracking-widest">
                        Content Health
                      </h4>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase">
                          Readability
                        </span>
                        <span className="text-xs font-bold text-slate-400"></span>
                      </div>

                      <div className="space-y-2">
                        <div className={`text-2xl font-bold ${color}`}>
                          {label} ({score.toFixed(1)})
                        </div>

                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor} transition-all`}
                            style={{ width: progressWidth }}
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* <section className="space-y-4">
                      <div className="flex items-center gap-2 font-bold">
                        <CheckCircle2 size={16} className="text-blue-500" />
                        <h4 className="text-xs uppercase tracking-widest">
                          On-Page SEO
                        </h4>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="relative w-14 h-14 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90">
                              <title>On-Page SEO</title>
                              <circle
                                cx="28"
                                cy="28"
                                r="24"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                className="text-slate-50"
                              />
                              <circle
                                cx="28"
                                cy="28"
                                r="24"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                strokeDasharray="150"
                                strokeDashoffset="12"
                                className="text-emerald-500"
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute text-sm font-bold">
                              92
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold">
                              Almost Perfect!
                            </p>
                            <p className="text-xs text-slate-400 font-bold">
                              2 fixes remaining
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {[
                            { label: "Focus keyword in H1", ok: true },
                            { label: "Meta description length", ok: true },
                            { label: "Keyword density", ok: false, warn: true },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="flex items-center gap-2 text-xs font-bold"
                            >
                              {item.ok ? (
                                <CheckCircle2
                                  size={12}
                                  className="text-emerald-500"
                                />
                              ) : (
                                <AlertCircle
                                  size={12}
                                  className="text-amber-500"
                                />
                              )}
                              <span
                                className={
                                  item.ok ? "text-slate-700" : "text-slate-400"
                                }
                              >
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="flex items-center gap-2 text-amber-600 font-bold">
                        <ShieldCheck size={16} />
                        <h4 className="text-xs uppercase tracking-widest">
                          EEAT Signals
                        </h4>
                      </div>
                      <div className="bg-white/50 p-5 rounded-2xl border border-dashed border-slate-200 space-y-4">
                        {[
                          { label: "Author Trust", ok: true },
                          { label: "Direct Experience", ok: true },
                          {
                            label: "External Citations",
                            ok: false,
                            warn: true,
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center gap-3"
                          >
                            {item.ok ? (
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            )}
                            <span className="text-xs font-bold text-slate-600">
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section> */}
                </aside>
              </div>
            );
          })()}
        </div>
      )}
    </PageLayout>
  );
}
