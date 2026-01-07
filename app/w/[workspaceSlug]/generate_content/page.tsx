"use client";

import { PageLayout } from "@/components/page-layout";
import { useWorkspace } from "@/providers/workspace-provider";
import { workspaceRoutes } from "@/lib/routes";
import { useEffect, useState } from "react";
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
  FileText,
  Save,
  Send,
  Lightbulb,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { MonthlyVolumeCard } from "@/components/ui/content/monthly-volume-card";
import { LoadingIndicatorVariants } from "@/components/ui/content/loading-indicator-variants";
import { Badge } from "@/components/ui/badge";
import type { Outline, WREXT } from "@/types/generate-content";
import { CountryDropdown } from "@/components/ui/country-dropdown";

export default function Page() {
  const { workspace, workspaceSlug } = useWorkspace();
  const [step, setStep] = useState<
    "keyword" | "suggestions" | "topic" | "outline" | "content"
  >("keyword");
  const [userKeyword, setUserKeyword] = useState("");
  const [country, setCountry] = useState("us");
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [rejectedReason, setRejectedReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [instruction, setInstruction] = useState<string>("");

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
      setInstruction(interrupt?.value.instruction);
    }

    // 1. Content Phase (Dominant)
    if (values.content?.final_content) {
      if (values.content?.final_content?.body_markdown) {
        setGeneratedContent(values.content?.final_content?.body_markdown);
      } else if (typeof values.content === "string") {
        setGeneratedContent(values.content);
      }
      if (step !== "content") setStep("content");
    }

    // 2. Outline Review Phase
    else if (interrupt?.value.type === "outline_review") {
      setOutline(interrupt?.value.data as Outline);
      if (step !== "outline" && step !== "content") setStep("content");
    }

    // 3. Selection Phase
    else {
      const keywords = interrupt?.value["Related Keywords"];
      if (keywords && keywords.length > 0) {
        setSuggestedKeywords(keywords);
        if (step === "keyword") setStep("suggestions");
      }
    }
  }, [values, step]);

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

  return (
    <PageLayout
      title="Generate Content"
      hideTitle={true}
      description={`View, edit, and manage AI-generated content for ${workspace?.title || "this workspace"}.`}
      breadcrumbs={breadcrumbs}
    >
      <div className="max-w-3xl mx-auto w-full min-h-[70vh] flex flex-col items-center justify-center relative px-6 overflow-hidden">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            What are we <span className="text-primary">writing</span> today?
          </h1>
          <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
            Transform your keywords into high-quality content with our
            AI-powered generation engine.
          </p>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 w-full">
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
                    className="h-12 px-4 text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-slate-200"
                  >
                    Generate
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <LoadingIndicatorVariants
        step={step}
        isLoading={isLoading}
        className="mt-5"
      />

      {step === "suggestions" && suggestedKeywords.length > 0 && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 mt-8 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-md">
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
              <div className="bg-white border border-gray-200 rounded-xl p-4 h-full flex flex-col justify-between transition-all hover:shadow-md">
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
                className={`bg-white border border-gray-200 rounded-xl p-4 h-full flex flex-col justify-between transition-all hover:shadow-md`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-400">
                    Monthly Volume
                  </span>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
                <MonthlyVolumeCard volume="1.2K" />
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
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
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
              <Button
                onClick={handleOutlineApprove}
                disabled={isLoading || isRejecting}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                Approve & Generate
              </Button>
              <Button
                disabled={isLoading}
                variant="outline"
                className={
                  isRejecting ? "bg-red-50 text-red-600 border-red-200" : ""
                }
              >
                {isRejecting ? "Confirm Rejection" : "Reject"}
              </Button>
            </div>

            {isRejecting && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <textarea
                  value={rejectedReason}
                  onChange={(e) => setRejectedReason(e.target.value)}
                  placeholder="Need changes? Let us know what to adjust..."
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-slate-900 outline-none min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={() => setIsRejecting(false)}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === "content" && values.content?.final_content && (
        <div className="animate-in fade-in duration-700 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 flex flex-col h-[800px]">
          {(() => {
            const fc = values.final_content || values.content?.final_content;
            const displayTitle =
              fc?.title || userKeyword || "New Content Piece";
            const body = fc?.body_markdown || generatedContent;
            const tags = fc?.tags || [];
            const author = workspace?.title || "WREXT AI";

            return (
              <>
                {/* Internal Navigation / Toolbar */}
                <header className="h-16 border-b px-6 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-slate-200">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-sm font-bold text-slate-900 truncate">
                        {displayTitle}
                      </h1>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className="h-4 px-1.5 text-[9px] font-bold uppercase tracking-wider border-slate-200 text-slate-500"
                        >
                          {author}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Live Editing
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-3 text-xs font-bold text-slate-500 hover:bg-slate-50"
                    >
                      <Save size={14} className="mr-2" /> Save
                    </Button>
                    <Button
                      size="sm"
                      className="h-9 px-4 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold shadow-lg shadow-slate-200"
                    >
                      <Send size={14} className="mr-2" /> Publish
                    </Button>
                  </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                  {/* Left Sidebar: Outline */}
                  <aside className="hidden lg:flex w-64 border-r bg-slate-50/50 flex-col py-6">
                    <div className="px-6 mb-6">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                        Structure
                      </h3>
                      <nav className="space-y-1">
                        <Button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-lg text-left">
                          <div className="w-1 h-1 rounded-full bg-emerald-500" />
                          Introduction
                        </Button>
                        {outline?.sections.map((sec, i) => (
                          <Button
                            key={sec.heading}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-lg text-left transition-colors"
                          >
                            <span className="text-[10px] font-mono text-slate-300">
                              {i + 1}
                            </span>
                            <span className="truncate">{sec.heading}</span>
                          </Button>
                        ))}
                      </nav>
                    </div>
                  </aside>

                  {/* Main Content Area */}
                  <main className="flex-1 overflow-y-auto bg-white p-8 md:p-16">
                    <article className="max-w-2xl mx-auto space-y-12">
                      <div className="space-y-8">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
                          {displayTitle}
                        </h1>
                        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {tags.map((t) => (
                            <span key={t}>#{t}</span>
                          ))}
                        </div>
                      </div>

                      {/* AI Insight Box */}
                      <div className="p-6 bg-emerald-50/50 border-l-4 border-emerald-500 rounded-r-2xl">
                        <div className="flex items-center gap-2 mb-2 text-emerald-700 font-black text-[10px] uppercase tracking-widest">
                          <Lightbulb size={14} />
                          AI Insight
                        </div>
                        <p className="text-sm text-emerald-800 leading-relaxed">
                          Content intent is matching the{" "}
                          <span className="font-bold underline">
                            Informational
                          </span>{" "}
                          criteria. Added deep research points to increase
                          trust.
                        </p>
                      </div>

                      <div className="prose prose-slate prose-lg max-w-none">
                        <div className="whitespace-pre-wrap text-slate-800 font-serif leading-[1.8] text-xl first-letter:text-5xl first-letter:font-black first-letter:mr-3 first-letter:float-left">
                          {body || (
                            <div className="space-y-4 animate-pulse">
                              <div className="h-4 bg-slate-100 rounded w-full" />
                              <div className="h-4 bg-slate-100 rounded w-5/6" />
                              <div className="h-4 bg-slate-100 rounded w-4/6" />
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  </main>

                  {/* Right Sidebar: Analysis */}
                  <aside className="hidden xl:flex w-80 border-l bg-slate-50/30 flex-col p-6 space-y-8 overflow-y-auto">
                    <section className="space-y-4">
                      <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <Activity size={16} className="text-emerald-500" />
                        <h4 className="text-xs uppercase tracking-widest">
                          Content Health
                        </h4>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase">
                            Readability
                          </span>
                          <Badge className="bg-blue-600 h-5 text-[10px] font-bold border-none">
                            Grade 8
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="text-2xl font-black text-slate-900">
                            Good
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                            <span>Sentence Length</span>
                            <span className="text-emerald-600">Optimal</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[82%]" />
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="flex items-center gap-2 text-slate-900 font-bold">
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
                            <span className="absolute text-sm font-black text-slate-900">
                              92
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-900">
                              Almost Perfect!
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold">
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
                              className="flex items-center gap-2 text-[10px] font-bold"
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
                            <span className="text-[10px] font-bold text-slate-600">
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </aside>
                </div>
              </>
            );
          })()}
        </div>
      )}

      <div className="p-8">
        {/* Enhanced Debug/Live State Panel */}
        <details className="mb-8 bg-gray-50 border rounded-xl overflow-hidden group">
          <summary className="p-4 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between font-medium text-gray-700">
            <div className="flex items-center gap-2">
              Live Stream Data (Full Values)
            </div>
            <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>
          <div className="border-t bg-white p-4">
            <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
              <div className="bg-blue-50 p-2 rounded border border-blue-100">
                <span className="text-blue-600 font-bold">Current Step:</span>{" "}
                {step}
              </div>
              <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                <span className="text-emerald-600 font-bold">Streaming:</span>{" "}
                {isLoading ? "Active" : "Idle"}
              </div>
            </div>
            <pre className="p-4 bg-gray-900 text-emerald-400 rounded-lg text-[10px] overflow-auto max-h-[400px] scrollbar-thin scrollbar-thumb-gray-700">
              {JSON.stringify(values, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </PageLayout>
  );
}
