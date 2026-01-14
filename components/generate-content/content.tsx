import type { Outline, WREXT } from "@/types/generate-content";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { isValidElement, type ReactNode } from "react";
import { Button } from "../ui/button";
import { Activity, Eye, Pencil, Save, Send } from "lucide-react";

type ReadabilityMeta = { label: string; color: string; barColor: string };

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

export function ContentEditor({
  values,
  generatedContent,
  isEditing,
  userKeyword,
  outline,
  onEditToggle,
  onContentChange,
}: {
  values: WREXT;
  generatedContent: string;
  isEditing: boolean;
  userKeyword: string;
  outline: Outline | null;
  onEditToggle: () => void;
  onContentChange: (val: string) => void;
}) {
  const fc = values.content?.final_content;
  const displayTitle = fc?.title || userKeyword || "New Content Piece";
  const body = generatedContent;
  const tags = fc?.tags || [];
  const score =
    values.content?.review?.readability_metrics?.flesch_reading_ease ?? 0;
  const { label, color, barColor } = getReadabilityMeta(score);
  const progressWidth = `${Math.round(Math.min(Math.max(score, 0), 100))}%`;

  return (
    <div className="animate-in fade-in duration-700 bg-white flex flex-col -mt-10 border-t">
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
                  <h1 className="text-lg font-bold truncate">{displayTitle}</h1>
                  <textarea
                    value={body}
                    onChange={(e) => onContentChange(e.target.value)}
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
                              id={slugify(getTextFromChildren(children))}
                              className="text-4xl font-bold mt-2 mb-6 tracking-tight leading-tight"
                              {...props}
                            >
                              {children}
                            </h1>
                          ),
                          h2: ({ children, ...props }) => (
                            <h2
                              id={slugify(getTextFromChildren(children))}
                              className="text-3xl font-bold mt-10 mb-4 tracking-tight"
                              {...props}
                            >
                              {children}
                            </h2>
                          ),
                          h3: ({ children, ...props }) => (
                            <h3
                              id={slugify(getTextFromChildren(children))}
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
                            <li className="pl-2 leading-relaxed" {...props} />
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
              onClick={onEditToggle}
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
        </aside>
      </div>
    </div>
  );
}
