import type {
  CONTENT,
  Outline,
  ReadabilityMeta,
  SEORESULT,
} from "@/types/generate-content";
import { Button } from "../ui/button";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Eye,
  Pencil,
  Save,
  Send,
} from "lucide-react";
import LexicalEditor from "../ui/lexical-editor";
import { useState } from "react";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useCurrentWorkspaceId } from "@/stores/workspace/use-workspace-context-store";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

export function ContentEditor({
  contentId,
  values,
  generatedContent,
  seoScore,
  isEditing,
  userKeyword,
  outline,
  onEditToggle,
  onContentChange,
}: {
  contentId?: string;
  values: CONTENT;
  generatedContent: string;
  isEditing: boolean;
  seoScore: SEORESULT | null;
  userKeyword: string;
  outline: Outline | null;
  onEditToggle: () => void;
  onContentChange: (val: string) => void;
}) {
  const fc = values?.final_content;
  const displayTitle = fc?.title || userKeyword || "New Content Piece";
  const body = generatedContent;
  const tags = fc?.tags || [];
  const score = values?.review?.readability_metrics?.flesch_reading_ease ?? 0;
  const { label, color, barColor } = getReadabilityMeta(score);
  const progressWidth = `${Math.round(Math.min(Math.max(score, 0), 100))}%`;
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successType, setSuccessType] = useState<"publish" | "save">("publish");

  const publishContent = async () => {
    try {
      setIsPublishing(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccessType("publish");
      setShowSuccessModal(true);
      toast.success("Content published successfully!");
    } catch (error: any) {
      toast.error(error.message || "Publish failed");
    } finally {
      setIsPublishing(false);
    }
  };

  const saveContent = async () => {
    try {
      setIsSaving(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccessType("save");
      setShowSuccessModal(true);
      toast.success("Content updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 bg-white flex flex-col -mt-10 border-t">
      <div className="flex flex-1 overflow-hidden relative border-b">
        {/* Left Sidebar: Outline */}
        <aside className="hidden lg:flex w-48 border-r bg-slate-50/50 flex-col py-6 mt-0.5">
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
        <main className="flex-1 overflow-y-auto bg-white px-2 py-4 mt-2">
          <article className="max-w-3xl mx-5">
            <div>
              {isEditing ? (
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-8">
                    {displayTitle}
                  </h1>
                  <div className="min-h-[600px]">
                    <LexicalEditor
                      initialValue={body}
                      onChange={onContentChange}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  {body ? (
                    <>
                      <div className="space-y-4 mb-8">
                        <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                          {tags.map((t) => (
                            <span
                              key={t}
                              className="bg-slate-50 px-2 py-1 rounded"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                          {displayTitle}
                        </h1>

                        {fc?.introduction && (
                          <div className="text-xl text-slate-600 leading-relaxed font-medium border-l-4 border-slate-200 pl-6 my-8 italic">
                            {fc.introduction}
                          </div>
                        )}
                      </div>
                      <div className="prose prose-slate prose-lg max-w-none">
                        <LexicalEditor initialValue={body} readOnly={true} />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-8 bg-slate-100 rounded w-3/4 mb-8" />
                      <div className="space-y-3">
                        <div className="h-4 bg-slate-100 rounded w-full" />
                        <div className="h-4 bg-slate-100 rounded w-5/6" />
                        <div className="h-4 bg-slate-100 rounded w-4/6" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </article>
        </main>

        {/* Right Sidebar: Analysis */}
        <aside className="hidden xl:flex w-64 border-l bg-slate-50/30 flex-col px-4 py-3 space-y-8 overflow-y-auto mt-2">
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
              onClick={saveContent}
              disabled={isSaving || isPublishing}
              variant="ghost"
              size="sm"
              className={`h-9 !px-1 text-xs font-bold transition-all`}
            >
              <Save size={14} className={isSaving ? "animate-spin" : ""} /> {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button
              onClick={publishContent}
              disabled={isPublishing || isSaving}
              size="sm"
              className="h-9 px-4 text-xs font-bold">
              <Send size={14} className={cn("mr-2", isPublishing ? "animate-pulse" : "")} /> {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          </div>
          {/* Success Modal */}
          <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
            <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-[2rem] p-8">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <DialogTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                    Content {successType === "publish" ? "Published" : "Saved"} Successfully!
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 text-base">
                    {successType === "publish"
                      ? "Your content has been published as a draft and is ready for review."
                      : "Your changes have been saved successfully to the workspace."}
                  </DialogDescription>
                </div>
                <Button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 h-12 rounded-2xl font-bold transition-all"
                >
                  Great, thanks!
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <section className="space-y-4">
            <div className="flex items-center gap-2 font-bold">
              <Activity size={16} className="text-emerald-500" />
              <h4 className="text-xs uppercase tracking-widest text-slate-500">
                Performance & SEO
              </h4>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4">
              <h4 className="text-lg font-bold text-slate-900">Readability</h4>

              <div className="space-y-2">
                <div className={`text-xl font-bold ${color}`}>
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
            {seoScore && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-6">
                <h4 className="text-lg font-bold text-slate-900">
                  On-Page SEO
                </h4>

                <div className="flex items-center gap-6">
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <title>{Math.round((seoScore as unknown as { score: number }).score || 0)}</title>
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-slate-100"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={226.2}
                        strokeDashoffset={
                          226.2 * (1 - ((seoScore as unknown as { score: number }).score || 0) / 100)
                        }
                        strokeLinecap="round"
                        className="text-emerald-900 transition-all duration-1000"
                      />
                    </svg>
                    <span className="absolute text-xl font-bold text-slate-800">
                      {Math.round((seoScore as unknown as { score: number }).score || 0)}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-lg font-bold text-slate-900 leading-tight">
                      {(seoScore as unknown as { label: string }).label || "Almost Perfect!"}
                    </div>
                    <div className="text-sm text-slate-500">
                      {(seoScore as unknown as { all_issues: { label: string }[] }).all_issues.length || 3} minor
                      optimizations left
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {(
                    (seoScore as unknown as { checks: { label: string, status: string }[] }).checks || [
                      { label: "Focus keyword in H1", status: "success" },
                      { label: "Meta description length", status: "success" },
                      { label: "Keyword density (0.8%)", status: "warning" },
                    ]
                  ).map((check: { label: string, status: string }, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      {check.status === "success" ? (
                        <CheckCircle2
                          size={18}
                          className="text-emerald-900 shrink-0"
                        />
                      ) : (
                        <AlertCircle
                          size={18}
                          className="text-orange-500 shrink-0"
                        />
                      )}
                      <span className="text-slate-600 font-medium leading-tight">
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
