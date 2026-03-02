import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, ChevronRight, Loader2, Info, ArrowLeft, ExternalLink, Globe, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Client } from "@langchain/langgraph-sdk";
import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useCurrentWorkspace } from "@/stores/workspace/use-workspace-context-store";
import { formatDistanceToNow } from "date-fns";

// Interface for stored keyword data based on backend keyword_recommendation.py
interface StoredKeyword {
  original_query: string;
  recommendations: string[];
  questions?: string[];
  related_topics?: string[];
  top_organic_results?: any[];
  seo_state: {
    keyword_difficulty: number | null;
    intent: string;
    volume: number | null;
    backlinks: number | null;
    referring_domains: number | null;
  };
  timestamp: string;
}

const mapDifficulty = (kd: number | null) => {
  if (kd === null || kd === undefined) return "Unknown";
  if (kd >= 70) return "Super hard";
  if (kd >= 50) return "Hard";
  if (kd >= 30) return "Medium";
  return "Easy";
};

const getDifficultyColor = (kd: number | null) => {
  if (kd === null || kd === undefined) return "text-gray-400";
  if (kd >= 70) return "text-red-500";
  if (kd >= 50) return "text-orange-500";
  if (kd >= 30) return "text-amber-500";
  return "text-emerald-500";
};

const getDifficultyBg = (kd: number | null) => {
  if (kd === null || kd === undefined) return "bg-gray-500/10";
  if (kd >= 70) return "bg-red-500/10 border-red-200";
  if (kd >= 50) return "bg-orange-500/10 border-orange-200";
  if (kd >= 30) return "bg-amber-500/10 border-amber-200";
  return "bg-emerald-500/10 border-emerald-200";
};

const formatVolume = (vol: number | null) => {
  if (vol === null || vol === undefined) return "0";
  if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
  return vol.toString();
};

const KDGauge = ({ score }: { score: number | null }) => {
  const normalizedScore = score ?? 0;
  const strokeDasharray = 251.2; // 2 * pi * r (r=40)
  const offset = strokeDasharray - (normalizedScore / 100) * strokeDasharray;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg className="w-32 h-32 transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="40"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-gray-100 dark:text-gray-800"
        />
        <circle
          cx="64"
          cy="64"
          r="40"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          style={{
            strokeDashoffset: isNaN(offset) ? strokeDasharray : strokeDasharray - (normalizedScore / 2 / 100) * strokeDasharray,
            stroke: normalizedScore < 30 ? "#10b981" : normalizedScore < 50 ? "#f59e0b" : normalizedScore < 70 ? "#f97316" : "#ef4444"
          }}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold leading-none">{score === null ? "--" : normalizedScore}</span>
        <span className={cn("text-xs font-medium mt-1 uppercase tracking-wider", getDifficultyColor(score))}>
          {mapDifficulty(score)}
        </span>
      </div>
    </div>
  );
};

interface LibraryViewProps {
  onSelectKeyword: (keyword: string) => void;
  onBack: () => void;
}

export function LibraryView({
  onSelectKeyword,
  onBack: _onBack,
}: LibraryViewProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<"list" | "detail">("list");

  const { user } = useAuthSession();
  const currentWorkspace = useCurrentWorkspace();

  const handleSearch = useCallback(async (query: string) => {
    // Ensure we have actual IDs from session and context
    const userId = user?.id;
    const workspaceId = currentWorkspace?.id;

    if (!userId || !workspaceId) {
      console.warn("⚠️ [DEBUG] Missing userId or workspaceId for library search");
      return;
    }

    setIsLoading(true);
    try {
      const client = new Client({
        apiUrl: resolveApiBaseUrl({
          explicitBaseUrl: process.env.NEXT_PUBLIC_LANGGRAPH_API_URL,
        }),
      });

      // Match the structured namespace tuple from the backend: ["library", userId, workspaceId]
      const specificPrefix = ["library", userId, workspaceId];

      console.log("🔍 [DEBUG] Searching Library - Namespace Prefix:", specificPrefix, "Query:", query);

      let searchResults = await client.store.searchItems(specificPrefix, {
        query: query,
        limit: 50
      });

      let items = (searchResults as any).items || [];

      console.log("✅ [DEBUG] Results Found:", items.length);

      // Group by query to deduplicate
      const uniqueItems: Record<string, any> = {};
      items.forEach((item: any) => {
        const value = item.value as StoredKeyword;
        const query = value.original_query || "Untitled Search";
        if (!uniqueItems[query] || new Date(value.timestamp || 0) > new Date(uniqueItems[query].value.timestamp || 0)) {
          uniqueItems[query] = item;
        }
      });

      const deduplicatedItems = Object.values(uniqueItems);
      console.log("✅ [DEBUG] Unique Results:", deduplicatedItems.length);

      const mapped = deduplicatedItems.map((res: any) => {
        const value = res.value as StoredKeyword;
        const kd = value.seo_state?.keyword_difficulty;
        return {
          id: res.key,
          keyword: value.original_query || "Untitled Search",
          difficulty: mapDifficulty(kd),
          difficultyScore: kd,
          volume: formatVolume(value.seo_state?.volume),
          intent: value.seo_state?.intent || "informational",
          lastUpdated: value.timestamp ? formatDistanceToNow(new Date(value.timestamp), { addSuffix: true }) : "Recent",
          rawData: value,
          namespace: res.namespace
        };
      });

      setKeywords(mapped);
    } catch (error) {
      console.error("Failed to search library:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, currentWorkspace?.id]);

  useEffect(() => {
    handleSearch("");
  }, [handleSearch]);

  const handleSelectKeyword = (item: any) => {
    setSelectedId(item.id);
    setSelectedItem(item);
    setView("detail");
  };

  const handleContinue = () => {
    if (selectedItem) {
      onSelectKeyword(selectedItem.keyword);
    }
  };

  if (view === "detail" && selectedItem) {
    const data = selectedItem.rawData as StoredKeyword;
    const kd = data.seo_state?.keyword_difficulty ?? 0;

    return (
      <div className="w-full h-full animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => setView("list")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Keyword Difficulty for &quot;{data.original_query}&quot;
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Globe className="h-3 w-3" /> SERP & KD updated {selectedItem.lastUpdated}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Difficulty Section */}
          <Card className="lg:col-span-4 p-8 flex flex-col items-center justify-center bg-white shadow-sm border-border/50">
            <KDGauge score={kd} />
            <p className="text-sm text-muted-foreground mt-6 text-center max-w-[240px]">
              We estimate that you&apos;ll need followed backlinks from
              <span className="font-bold text-foreground"> ~{data.seo_state?.backlinks ?? 0}</span> websites
              to rank in the top 10 for this keyword.
            </p>
          </Card>

          {/* Quick Metrics */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 flex flex-col justify-center bg-white shadow-sm border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Volume</span>
              <span className="text-2xl font-bold text-primary">{selectedItem.volume}</span>
            </Card>
            <Card className="p-4 flex flex-col justify-center bg-white shadow-sm border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Intent</span>
              <span className="text-lg font-bold capitalize text-foreground">{data.seo_state?.intent || "N/A"}</span>
            </Card>
            <Card className="p-4 flex flex-col justify-center bg-white shadow-sm border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Backlinks</span>
              <span className="text-2xl font-bold text-foreground">{data.seo_state?.backlinks ?? "-"}</span>
            </Card>
            <Card className="p-4 flex flex-col justify-center bg-white shadow-sm border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Domains</span>
              <span className="text-2xl font-bold text-foreground">{data.seo_state?.referring_domains ?? "-"}</span>
            </Card>
          </div>
        </div>

        {/* SERP Overview Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              SERP overview <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </h2>
            <Button variant="outline" size="sm" className="text-xs h-8">
              Full SERP Analysis
            </Button>
          </div>

          <Card className="overflow-hidden border-border/50 shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-border text-muted-foreground font-medium uppercase text-[10px] tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Search result</th>
                    <th className="px-4 py-4 text-right">Position</th>
                    <th className="px-4 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.top_organic_results?.map((res, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-mono">{idx + 1}</span>
                            <span className="font-semibold text-primary truncate max-w-[400px] block cursor-pointer hover:underline">
                              {res.title}
                            </span>
                          </div>
                          <p className="text-xs text-emerald-600 truncate max-w-[400px] font-medium">
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
                        <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors inline-block p-1">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </td>
                    </tr>
                  )) || (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                          No organic results data available for this keyword.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-gray-50/50 border-t border-border">
              <p className="text-[10px] text-muted-foreground italic flex items-center justify-center gap-1">
                <HelpCircle className="h-3 w-3" /> Data provided by DataForSEO Advanced SERP API
              </p>
            </div>
          </Card>
        </div>

        {/* Related Topics / Recommendations */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-foreground">Related Topics</h3>
            <div className="flex flex-wrap gap-2">
              {data.related_topics?.map((topic, i) => (
                <Badge key={i} variant="outline" className="bg-white hover:bg-primary/5 cursor-pointer py-1.5 px-3">
                  {topic}
                </Badge>
              )) || <p className="text-sm text-muted-foreground">None found</p>}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-bold text-foreground">Smart Recommendations</h3>
            <div className="flex flex-wrap gap-2">
              {data.recommendations?.map((rec, i) => (
                <Badge key={i} variant="secondary" className="bg-primary/5 text-primary hover:bg-primary/10 border-primary/20 cursor-pointer py-1.5 px-3 font-medium">
                  {rec}
                </Badge>
              )) || <p className="text-sm text-muted-foreground">None found</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-border z-20">
          <Button variant="outline" size="lg" onClick={() => setView("list")}>
            Back to Library
          </Button>
          <Button size="lg" onClick={handleContinue} className="px-10 font-bold shadow-lg shadow-primary/20">
            Continue with this Keyword <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Keyword Library
        </h1>
        <p className="text-muted-foreground">
          Select a keyword to view deep SEO insights and generate content.
        </p>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <Input
            placeholder="Search saved keywords..."
            className="pl-10 bg-white text-foreground shadow-none h-11 border-border/50 focus-visible:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(search);
              }
            }}
          />
        </div>
        <Button
          className="h-11 px-6 font-semibold"
          onClick={() => handleSearch(search)}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
          Search Library
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && keywords.length === 0 && (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-40 animate-pulse bg-muted/40 border-none" />
          ))
        )}

        {!isLoading && keywords.map((item) => (
          <Card
            key={item.id}
            onClick={() => handleSelectKeyword(item)}
            className={cn(
              "group cursor-pointer transition-all duration-300 border-border/50 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 bg-card overflow-hidden",
              selectedId === item.id ? "ring-2 ring-primary border-primary bg-primary/[0.02]" : ""
            )}
          >
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <Badge
                  variant="secondary"
                  className={cn(
                    "font-bold text-[10px] uppercase tracking-wider px-2 py-0.5",
                    getDifficultyBg(item.difficultyScore)
                  )}
                >
                  {item.difficulty}
                </Badge>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Updated</div>
                  <div className="text-xs font-semibold text-foreground/80">{item.lastUpdated}</div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-xl leading-snug group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
                  {item.keyword}
                </h3>
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Est. Volume</span>
                    <span className="text-lg font-bold text-foreground">{item.volume}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 text-xs font-bold text-primary hover:bg-primary/10 hover:text-primary rounded-full group/btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectKeyword(item.keyword);
                      }}
                    >
                      Use Keyword
                      <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!isLoading && keywords.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-3xl bg-muted/20">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No keyword results found</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            Try a different search term or run a new keyword analysis to build your library.
          </p>
          <Button variant="outline" className="mt-8" onClick={() => handleSearch("")}>
            View All Saved Keywords
          </Button>
        </div>
      )}

      {selectedId && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 animate-in fade-in zoom-in slide-in-from-bottom-5">
          <Button size="lg" onClick={handleContinue} className="px-8 shadow-2xl shadow-primary/40 font-bold rounded-full h-14 text-lg">
            Generate Content for &quot;{selectedItem?.keyword}&quot; <ChevronRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
