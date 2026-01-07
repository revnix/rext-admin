"use client";

import { PageLayout } from "@/components/page-layout";
import { useWorkspace } from "@/providers/workspace-provider";
import { workspaceRoutes } from "@/lib/routes";
import { useEffect, useState } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";
import { log } from "@/lib/logger";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChartRadialStacked } from "@/components/ui/content/chart-radial-stacked";
import { SearchIntentCard } from "@/components/ui/content/intent-card";
import { Compass, TrendingUp, Zap } from "lucide-react";
import { MonthlyVolumeCard } from "@/components/ui/content/monthly-volume-card";

type NormalizedOrganicResult = {
  position: number;
  title: string;
  url: string;
  snippet: string;
  domain: string;
  date?: string;
  has_sitelinks: boolean;
};

type SERPNormalized = {
  query: string;
  engine: string;
  normalize_results: NormalizedOrganicResult[];
  related_topics: string[];
  questions: string[];
  stats: Record<string, number>;
  domains: string[];
  domain_stats: Record<string, unknown>;
  freshness: Record<string, unknown>;
  features: Record<string, boolean>;
};

type OutlineSection = {
  heading: string;
  description: string;
  key_points: string[];
  suggested_word_count: number;
};

type Outline = {
  title: string;
  brief: string;
  sections: OutlineSection[];
  tone: string;
  target_audience: string[];
};

type Content = {
  title: string;
  content: string;
  tags: string[];
  final_content: FinalContent;
};

type FinalContent = {
  title: string;
  content: string;
  tags: string[];
  body_markdown: string;
  meta_title?: string;
  meta_description?: string;
};

type WREXT = {
  messages: Message[];
  serp_payload: {
    query: string;
    country: string; // SUPPORTED_COUNTRIES
  };
  serp_result: {
    organic_results: Array<Record<string, unknown>>;
    related_searches: string[];
    people_ask: Array<Record<string, unknown>>;
    search_information: Record<string, unknown>;
    total_results: number;
  };
  serp_normalized: SERPNormalized;
  competitors: Array<{
    domain: string;
    top_positions: number[];
    total_occurrences: number;
    has_sitelinks: boolean;
    intent_distribution: Record<string, number>;
    freshness: Record<string, number>;
    avg_snippet_length: number;
    featured_snippet: boolean;
    is_brand: boolean;
  }>;
  scrape_context: {
    documents: Array<{
      document: unknown; // Document type
      content_length: number;
      keywords: string[];
      headings: string[];
    }>;
    total_documents: number;
  };
  relevant_context: unknown[]; // Document[]
  seo_result: unknown; // SEORESULT
  content: Content; // CONTENT
  outline?: Outline;
  final_content?: FinalContent;
  topics?: string[];
  status?: string;
  rejected_reason?: string;
  instruction_response?: string;
  "Selected Topic"?: string;
  "Primary Keyword"?: string;
  "Related Keywords"?: string[];
  continue_workflow?: boolean;
  __interrupt__?: Array<{
    id: string;
    value: {
      instruction: string;
      "Primary Keyword": string;
      "Related Keywords": string[];
      [key: string]: unknown;
    };
  }>;
};

export default function Page() {
  const { workspace, workspaceSlug } = useWorkspace();

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Generate Content" },
  ];

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

  const { values, submit, stop, isLoading } = useStream<WREXT>({
    apiUrl: "http://localhost:2024",
    assistantId: "agent",
    messagesKey: "messages",
    threadId: threadId,
    onThreadId: setThreadId,
  });

  // Automatically fetch current country with fallbacks (via proxy to bypass CSP)
  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const response = await fetch("/api/country");
        if (!response.ok) throw new Error("Failed to fetch country from proxy");

        const data = await response.json();
        if (data.countryCode) {
          const detectedCountry = data.countryCode;
          setCountry(detectedCountry);
          log.info("[Fetch Country Success]", { detectedCountry });
        }
      } catch (error) {
        log.error("[Fetch Country Error]", error);
        setCountry("us");
      }
    };
    fetchCountry();
  }, []);

  // Track all state changes from stream
  useEffect(() => {
    if (!values) return;
    log.info("[Stream Values Update]", values);
    log.info("[Stream Values Update]", {
      step,
      values: {
        competitors: values.competitors,
        relevant_context: values.relevant_context,
        scrape_context: values.scrape_context,
        seo_result: values.seo_result,
        serp_normalized: values.serp_normalized,
        serp_result: values.serp_result,
        __interrupt__: values.__interrupt__,
        messages: values.messages?.slice(-1), // Last message only
      },
    });

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
      if (step !== "outline" && step !== "content") setStep("outline");
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

  // Step 1: Submit user keyword
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
    setStep("keyword");
  };

  // // Step 2: Select keyword → get topics
  const handleKeywordSelect = (selected: string) => {
    log.info("[User Action: Select Keyword]", selected);

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
    setStep("suggestions");
  };

  const handleOutlineApprove = () => {
    // Use null to avoid trying to update state keys, preventing InvalidUpdateError
    submit(null, {
      command: { resume: "approve" },
    });
  };

  const handleOutlineReject = () => {
    if (!isRejecting) {
      setIsRejecting(true);
      return;
    }

    if (!rejectedReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    submit(null, {
      command: { resume: { action: "reject", reason: rejectedReason } },
    });
    setIsRejecting(false);
    setRejectedReason("");
  };

  useEffect(() => {
    log.info("[User Action: Suggested Keyword]", values);
  }, [values]);

  // Reset with logging
  const reset = () => {
    log.info("[User Action: Reset Flow]");
    setStep("keyword");
    setSuggestedKeywords([]);
    setGeneratedContent("");
  };

  return (
    <PageLayout
      title="Generate Content"
      description={`View, edit, and manage AI-generated content for ${
        workspace?.title || "this workspace"
      }.`}
      breadcrumbs={breadcrumbs}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleKeywordSubmit();
        }}
        className="flex gap-3 w-full "
      >
        <Input
          type="text"
          placeholder="Enter keyword"
          className="h-10 w-[80%]"
          value={userKeyword}
          onChange={(e) => setUserKeyword(e.target.value)}
          required
        />
        <Button type="submit" className="h-10 w-[20%]">
          Submit
        </Button>
      </form>

      {/* Global Loading Indicator */}
      {isLoading && (
        <div className="my-4 animate-in fade-in duration-300">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-900">
                {step === "keyword"
                  ? "Analyzing Keyword..."
                  : step === "topic"
                    ? "Generating Search Topics..."
                    : step === "suggestions"
                      ? "Generating Content Outline..."
                      : step === "outline"
                        ? "Generating Premium Content..."
                        : "Loading..."}
              </h3>
              <p className="text-[11px] text-blue-700 mt-1">
                Agent is processing in real-time. Please wait for the next step.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 mt-8 gap-4">
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

      {step === "suggestions" && suggestedKeywords.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">{instruction}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {suggestedKeywords.map((kw, i) => (
              <button
                key={i}
                onClick={() => handleKeywordSelect(kw)}
                className="bg-green-100 hover:bg-green-200 border border-green-300 p-4 rounded-lg transition-all hover:scale-105 text-left"
              >
                <strong>{kw}</strong>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-8 max-w-2xl mx-auto">
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

        {step === "outline" && outline && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 border-b p-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {outline.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{outline.brief}</p>
              </div>

              <div className="p-4 space-y-6">
                {outline.sections.map((section, idx) => (
                  <div key={idx} className="space-y-2">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      {section.heading}
                    </h3>
                    <p className="text-sm text-gray-600 ml-8">
                      {section.description}
                    </p>
                    <ul className="ml-12 space-y-1">
                      {section.key_points.map((point: string, pIdx: number) => (
                        <li
                          key={pIdx}
                          className="text-xs text-gray-500 list-disc"
                        >
                          {point}
                        </li>
                      ))}
                    </ul>
                    <div className="ml-8 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                      Suggested: {section.suggested_word_count} words
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 border-t p-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-700">Tone:</span>
                    <span className="text-gray-600">{outline.tone}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-700">Audience:</span>
                    <span className="text-gray-600">
                      {outline.target_audience?.join(", ")}
                    </span>
                  </div>
                </div>

                {isRejecting && (
                  <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                    <label
                      htmlFor="rejectedReason"
                      className="text-sm font-medium text-gray-700"
                    >
                      Reason for Rejection
                    </label>
                    <textarea
                      id="rejectedReason"
                      name="rejectedReason"
                      value={rejectedReason}
                      onChange={(e) => setRejectedReason(e.target.value)}
                      placeholder="Example: Need more focus on SSR, or add a section about Next.js 15..."
                      className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none min-h-[100px]"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleOutlineApprove}
                    disabled={isLoading || isRejecting}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    ✅ Approve Outline
                  </button>
                  <button
                    onClick={handleOutlineReject}
                    disabled={isLoading}
                    className={`flex-1 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      isRejecting
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-white border-2 border-red-100 text-red-600 hover:bg-red-50"
                    }`}
                  >
                    {isRejecting ? "Confirm Rejection" : "❌ Reject & Refine"}
                  </button>
                </div>

                {isRejecting && (
                  <button
                    onClick={() => setIsRejecting(false)}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Cancel Rejection
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === "content" &&
          (generatedContent ||
            values.final_content ||
            values.content?.final_content) && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {values.final_content || values.content?.final_content ? (
                <div className="bg-white border rounded-2xl shadow-xl overflow-hidden">
                  {(() => {
                    const fc =
                      values.final_content || values.content?.final_content;
                    return (
                      <>
                        <div className="bg-emerald-600 p-8 text-white">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                              Draft Generated
                            </span>
                          </div>
                          <h2 className="text-3xl font-bold mb-2">
                            {fc.title}
                          </h2>
                          <div className="flex flex-wrap gap-2 mt-4">
                            {fc.tags?.map((tag: string, i: number) => (
                              <span
                                key={i}
                                className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="p-8 space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <div>
                              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                Meta Title
                              </h4>
                              <p className="text-sm font-medium text-gray-700">
                                {fc.meta_title}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                Meta Description
                              </h4>
                              <p className="text-sm text-gray-600 italic">
                                {fc.meta_description}
                              </p>
                            </div>
                          </div>
                          <div className="prose prose-emerald max-w-none">
                            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed font-serif text-lg">
                              {fc.body_markdown}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 p-8 rounded-xl shadow-lg animate-in zoom-in duration-500">
                  <h2 className="text-2xl font-bold mb-6 text-emerald-800">
                    ✅ Generated Content
                  </h2>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap text-gray-900 leading-relaxed">
                      {generatedContent}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        <div className="mt-8 flex gap-3">
          <button
            onClick={reset}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            🔄 Reset Flow
          </button>
          {isLoading && (
            <button
              onClick={() => stop()}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              ⏹️ Stop Streaming
            </button>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
