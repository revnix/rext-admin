import { useState, useEffect, useCallback } from "react";
import type { MouseEvent } from "react";
import { Search, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Client } from "@langchain/langgraph-sdk";
import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { useAuthSession } from "@/hooks/use-auth-session";
import { authenticatedFetch, getAuthHeaders } from "@/lib/auth-utils";
import { tokenUserId } from "@/lib/generate-content/generation-identity";
import { formatDistanceToNow } from "date-fns";
import { log } from "@/lib/logger";
import { apiClient } from "@/lib/api-client";
import LibraryDetail from "./library-detail";
import type {
  LibraryItem,
  StoredKeyword,
  StoreItem,
} from "@/types/generate-content";
import { getDifficultyLabel } from "../ui/content/chart-radial-stacked";
import {
  describeMonthlyVolume,
  formatCompactVolume,
  type MonthlyVolumeInput,
} from "@/lib/generate-content/monthly-volume";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/providers/workspace-provider";
import type { Route } from "next";

const libraryLogger = log.forComponent("library-view");

const getDifficultyBg = (kd: number | null) => {
  if (kd === null || kd === undefined) return "bg-gray-500/10";
  if (kd >= 70) return "bg-red-500/10 border-red-200";
  if (kd >= 50) return "bg-orange-500/10 border-orange-200";
  if (kd >= 30) return "bg-amber-500/10 border-amber-200";
  return "bg-emerald-500/10 border-emerald-200";
};

// "—" with the reason on hover when there is no number (the design language's
// unknown value), never "N/A".
const volumeCell = (volume: MonthlyVolumeInput, status?: string | null) => {
  const display = describeMonthlyVolume(volume, status);
  return display.kind === "volume"
    ? { text: formatCompactVolume(display.volume), title: undefined }
    : { text: "—", title: display.label };
};

export function LibraryView() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [keywords, setKeywords] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<"list" | "detail">("list");
  const { user } = useAuthSession();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LibraryItem | null>(null);
  const router = useRouter();
  const { workspace } = useWorkspace();

  const handleSearch = useCallback(
    async (query: string) => {
      // Ensure we have actual IDs from session and context
      const userId = user?.id;
      const workspaceId = workspace?.id;

      if (!userId || !workspaceId) {
        libraryLogger.warn("Missing userId or workspaceId for library search");
        return;
      }

      setIsLoading(true);
      try {
        // The store answers only a signed-in caller, and only for the library
        // of the user their token speaks for: the impersonated user while a
        // super admin impersonates someone. authenticatedFetch adds the token,
        // and refreshes it and retries when it has expired.
        const { Authorization } = await getAuthHeaders();
        const ownerId =
          tokenUserId(Authorization?.replace(/^Bearer\s+/i, "") ?? "") ??
          userId;
        const client = new Client({
          apiUrl: resolveApiBaseUrl({
            explicitBaseUrl: process.env.NEXT_PUBLIC_LANGGRAPH_API_URL,
          }),
          callerOptions: { fetch: authenticatedFetch },
        });

        const specificPrefix = ["library", ownerId, workspaceId];

        const searchResults = await client.store.searchItems(specificPrefix, {
          query: query,
          limit: 50,
        });

        const items =
          (searchResults as unknown as { items: StoreItem[] }).items || [];

        const uniqueItems: Record<string, StoreItem> = {};
        items.forEach((item) => {
          const value = item.value as StoredKeyword;
          const query = value.original_query || "Untitled Search";
          if (
            !uniqueItems[query] ||
            new Date(value.timestamp || 0) >
              new Date(uniqueItems[query].value.timestamp || 0)
          ) {
            uniqueItems[query] = item;
          }
        });

        const deduplicatedItems = Object.values(uniqueItems);

        const mapped: LibraryItem[] = deduplicatedItems.map((res) => {
          const value = res.value;
          const kd = value.seo_state?.keyword_difficulty;
          return {
            id: res.key,
            keyword: value.original_query || "Untitled Search",
            difficulty: getDifficultyLabel(kd),
            difficultyScore: kd,
            volume: value.seo_state?.volume,
            volumeStatus: value.seo_state?.volume_status,
            intent: value.seo_state?.intent || "informational",
            lastUpdated: value.timestamp
              ? formatDistanceToNow(new Date(value.timestamp), {
                  addSuffix: true,
                })
              : "Recent",
            rawData: value,
            namespace: res.namespace,
          };
        });

        setKeywords(mapped);
      } catch (error) {
        libraryLogger.error("Failed to search library", { error });
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, workspace?.id],
  );

  useEffect(() => {
    handleSearch("");
  }, [handleSearch]);

  const handleSelectKeyword = (item: LibraryItem) => {
    setSelectedId(item.id);
    setSelectedItem(item);
    setView("detail");
  };

  const handleDelete = (e: MouseEvent, item: LibraryItem) => {
    e.stopPropagation();
    if (!workspace?.id) return;

    setPendingDelete(item);
  };

  const confirmDelete = async () => {
    const item = pendingDelete;
    if (!item) return;

    setPendingDelete(null);
    setDeletingId(item.id);
    try {
      await apiClient.keywordLibrary.delete(item.id, item.namespace);

      toast.success(`"${item.keyword}" has been removed from your library.`);

      setKeywords((prev) => prev.filter((k) => k.id !== item.id));
    } catch (error: unknown) {
      const err = error as Error;
      libraryLogger.error("Failed to delete keyword", { error: err });
      toast.error(err.message || "Failed to delete keyword from library.");
    } finally {
      setDeletingId(null);
    }
  };

  if (view === "detail" && selectedItem) {
    const data = selectedItem.rawData as StoredKeyword;
    const kd = data.seo_state?.keyword_difficulty ?? 0;

    return (
      <LibraryDetail
        data={data}
        kd={kd}
        setView={setView}
        selectedItem={selectedItem}
      />
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

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
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
          className="h-11 px-3 sm:px-6 font-semibold shrink-0"
          onClick={() => handleSearch(search)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
          ) : (
            <Search className="h-4 w-4 sm:mr-2" />
          )}
          <span className="hidden sm:inline">Search Library</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {!isLoading &&
          keywords.map((item) => (
            <Card
              key={item.id}
              onClick={() => handleSelectKeyword(item)}
              className={cn(
                "group cursor-pointer transition-colors duration-200 border-border hover:border-foreground/40 bg-card overflow-hidden",
                selectedId === item.id ? "border-foreground" : "",
              )}
            >
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "font-bold text-[10px] uppercase tracking-wider px-2 py-0.5",
                      getDifficultyBg(item.difficultyScore),
                    )}
                  >
                    {item.difficulty}
                  </Badge>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                      Updated
                    </div>
                    <div className="text-xs font-semibold text-foreground/80">
                      {item.lastUpdated}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-xl leading-snug group-hover:text-primary transition-colors line-clamp-2 min-h-14">
                    {item.keyword}
                  </h3>
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                        Est. Volume
                      </span>
                      <span
                        className="text-lg font-bold tabular-nums text-foreground"
                        title={volumeCell(item.volume, item.volumeStatus).title}
                      >
                        {volumeCell(item.volume, item.volumeStatus).text}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 text-xs font-bold text-primary hover:bg-primary/10 hover:text-primary rounded-full group/btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/w/${workspace?.slug}/generate_content?library=${item.keyword}` as Route,
                          );
                        }}
                      >
                        Use Keyword
                        <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={deletingId === item.id}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                        onClick={(e) => handleDelete(e, item)}
                        title="Delete from library"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
      </div>

      {!isLoading && keywords.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-md bg-muted/20">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            No keyword results found
          </h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            Try a different search term or run a new keyword analysis to build
            your library.
          </p>
        </div>
      )}

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Keyword
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete{" "}
              <span className="font-semibold text-foreground">
                "{pendingDelete?.keyword}"
              </span>{" "}
              from your keyword library. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
