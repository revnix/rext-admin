import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Globe,
  ExternalLink,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  Loader2,
  Tags,
} from "lucide-react";
import { useState, useMemo } from "react";
import type { LibraryItem, StoredKeyword } from "@/types/generate-content";
import { SafeChartRadialStacked } from "../ui/content/safe-chart-radial-stacked";
import { MonthlyVolumeCard } from "../ui/content/monthly-volume-card";
import { SearchIntentCard } from "../ui/content/intent-card";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/providers/workspace-provider";
import type { Route } from "next";

type IntentOption =
  | "informational"
  | "commercial"
  | "transactional"
  | "navigational";

const VALID_INTENTS: IntentOption[] = [
  "informational",
  "commercial",
  "transactional",
  "navigational",
];

type IntentOptionItem = { value: IntentOption; label: string };

function resolveIntentOptions(
  intent: string | string[] | undefined,
): IntentOptionItem[] {
  if (!intent) return [];
  const raw = Array.isArray(intent) ? intent : [String(intent)];
  const seen = new Set<string>();
  const result: IntentOptionItem[] = [];
  raw.forEach((v, idx) => {
    const norm = v?.trim().toLowerCase() as IntentOption;
    if (!VALID_INTENTS.includes(norm) || seen.has(norm)) return;
    seen.add(norm);
    const source = idx === 0 ? "SEO Data" : "AI Suggested";
    result.push({
      value: norm,
      label: `${norm.charAt(0).toUpperCase() + norm.slice(1)} — ${source}`,
    });
  });
  return result;
}

export default function LibraryDetail({
  data,
  kd,
  setView,
  selectedItem,
}: {
  data: StoredKeyword;
  kd: number;
  setView: (view: "list" | "detail") => void;
  selectedItem: LibraryItem;
}) {
  const router = useRouter();
  const { workspace } = useWorkspace();

  const intentOptions = useMemo(
    () => resolveIntentOptions(data.seo_state?.intent),
    [data.seo_state?.intent],
  );

  const [selectedIntent, setSelectedIntent] = useState<IntentOption | "">(
    () => {
      const raw = Array.isArray(data.seo_state?.intent)
        ? data.seo_state.intent[0]
        : data.seo_state?.intent;
      const norm = raw?.trim().toLowerCase() as IntentOption;
      return VALID_INTENTS.includes(norm) ? norm : "";
    },
  );

  const handleContinue = () => {
    const intentParam = selectedIntent ? `&intent=${selectedIntent}` : "";
    router.push(
      `/w/${workspace?.slug}/generate_content?library=${selectedItem.keyword}${intentParam}` as Route,
    );
  };

  return (
    <div className="relative w-full h-full animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      <button
        type="button"
        className="flex items-center gap-4 mb-8 cursor-pointer border-none bg-transparent p-0 text-left outline-none"
        onClick={() => setView("list")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setView("list");
          }
        }}
        aria-label="Back to library list"
      >
        <ArrowLeft className="h-5 w-5" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Overview for &quot;{selectedItem.keyword}&quot;
          </h1>
          <p className="text-sm text-muted-foreground flex items-start sm:items-center gap-2">
            <Globe className="h-3 w-3 mt-1 sm:mt-0" /> SERP & KD updated{" "}
            {selectedItem.lastUpdated}
          </p>
        </div>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Difficulty Section */}
        <Card className="xl:col-span-4 lg:col-span-5 p-8 flex flex-col items-center justify-center bg-white shadow-sm border-border/50 dark:bg-card">
          <SafeChartRadialStacked difficultyScore={kd} />
          <p className="text-sm text-muted-foreground mt-6 text-center max-w-[240px]">
            We estimate that you&apos;ll need followed backlinks from
            <span className="font-bold text-foreground">
              {" "}
              ~{data.seo_state?.backlinks ?? 0}
            </span>{" "}
            websites to rank in the top 10 for this keyword.
          </p>
        </Card>

        {/* Quick Metrics */}
        <div className="xl:col-span-8 lg:col-span-7 grid grid-cols-2 grid-rows-2 md:grid-cols-4 gap-4">
          <Card className="p-4 col-span-2 flex flex-col justify-center bg-white shadow-sm border-border/50 dark:bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Monthly Volume
              </span>
              <TrendingUp className="w-4 h-4 text-foreground" />
            </div>
            {selectedItem?.volume ? (
              <MonthlyVolumeCard volume={String(selectedItem?.volume)} />
            ) : (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Fetching volume...
              </>
            )}
          </Card>
          <Card className="p-4 col-span-2 flex flex-col justify-center bg-white shadow-sm border-border/50 dark:bg-card">
            {data.seo_state?.intent ? (
              <div className="space-y-2">
                {selectedIntent && <SearchIntentCard intent={selectedIntent} />}
                {intentOptions.length > 0 && (
                  <div className="flex flex-col gap-2 mt-4">
                    {intentOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <input
                          type="radio"
                          name="search-intent"
                          value={opt.value}
                          checked={selectedIntent === opt.value}
                          onChange={() => setSelectedIntent(opt.value)}
                          className="sr-only"
                        />
                        <span
                          className={`w-3.5 h-3.5 rounded-full border shrink-0 flex items-center justify-center transition-colors ${
                            selectedIntent === opt.value
                              ? "border-primary bg-primary"
                              : "border-border bg-background group-hover:border-primary/50"
                          }`}
                        >
                          {selectedIntent === opt.value && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                          )}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                            selectedIntent === opt.value
                              ? "text-foreground"
                              : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        >
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Analyzing intent...
              </>
            )}
          </Card>
          <Card className="p-4 col-span-2 flex flex-col justify-center bg-white shadow-sm border-border/50 dark:bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Backlinks
            </span>
            <span className="text-2xl font-bold text-foreground">
              {data.seo_state?.backlinks ?? "-"}
            </span>
          </Card>
          <Card className="p-4 col-span-2 flex flex-col justify-center bg-white shadow-sm border-border/50 dark:bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Domains
            </span>
            <span className="text-2xl font-bold text-foreground">
              {data.seo_state?.referring_domains ?? "-"}
            </span>
          </Card>
        </div>
      </div>

      {/* SERP Overview Section */}
      <div className="space-y-4 ">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            SERP overview{" "}
          </h2>
        </div>

        <Card className="overflow-hidden border-border/50 shadow-sm bg-white dark:bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-border text-muted-foreground font-medium uppercase text-xs tracking-widest dark:bg-card">
                <tr>
                  <th className="px-6 py-4">Search result</th>
                  <th className="px-4 py-4 text-right">Position</th>
                  <th className="px-4 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.top_organic_results?.map((res, _idx) => (
                  <tr key={res.url}>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary dark:text-white truncate max-w-[400px] block cursor-default">
                            {res.title}
                          </span>
                        </div>
                        <p className="text-xs text-primary truncate max-w-[400px] font-medium">
                          {res.url}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-[500px]">
                          {res.snippet}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-medium">
                      {res.position}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors inline-block p-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      No organic results data available for this keyword.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-gray-50/50 border-t border-border dark:bg-card">
            <p className="text-xs text-muted-foreground italic flex items-center justify-center gap-1">
              <HelpCircle className="h-3 w-3" /> Data provided by DataForSEO
              Advanced SERP API
            </p>
          </div>
        </Card>
      </div>

      {/* Related Topics */}
      <div className="mt-12">
        <Card className="overflow-hidden border-border/50 shadow-sm bg-white dark:bg-card">
          <div className="px-6 py-5 border-b border-border/50 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-muted ring-1 ring-border flex items-center justify-center shrink-0">
                <Tags className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground leading-tight">
                  Related Topics
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Keyword clusters &amp; topic ideas to explore
                </p>
              </div>
            </div>
            {!!data.related_topics?.length && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full border border-border/50 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                {data.related_topics.length} topics
              </div>
            )}
          </div>
          {data.related_topics?.length ? (
            <div className="p-6 flex flex-wrap flex-col sm:flex-row gap-2.5">
              {data.related_topics.map((topic) => (
                <div
                  key={topic}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-muted/30 hover:bg-primary/10 border border-border/60 hover:border-primary/40 text-foreground/90 hover:text-foreground transition-all duration-200 cursor-default group"
                >
                  <span className="text-primary text-sm font-black leading-none">
                    #
                  </span>
                  {topic}
                </div>
              ))}
            </div>
          ) : (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              No related topics found.
            </p>
          )}
        </Card>
      </div>

      <div className="w-full sm:w-auto flex justify-between items-center fixed bottom-0 right-0 p-6 z-20">
        <Button
          size="lg"
          onClick={handleContinue}
          className="w-full sm:w-auto px-10 font-bold"
        >
          Continue with this Keyword <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
