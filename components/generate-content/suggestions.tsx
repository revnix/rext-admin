"use client";

import type { KeywordCluster, SEORESULT } from "@/types/generate-content";
import {
  Zap,
  Compass,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  Loader2,
  Layers,
} from "lucide-react";
import { SafeChartRadialStacked } from "../ui/content/safe-chart-radial-stacked";
import { MonthlyVolumeCard } from "../ui/content/monthly-volume-card";
import { SearchIntentCard } from "../ui/content/intent-card";
import { useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

type IntentOption =
  | "informational"
  | "commercial"
  | "transactional"
  | "navigational";

type IntentOptionItem = { value: IntentOption; label: string };

const VALID_INTENTS = [
  "informational",
  "commercial",
  "transactional",
  "navigational",
];

/** Resolve the intent list from backend, preserving SEO vs AI labels. */
function resolveIntentOptions(intent: SEORESULT["intent"]): IntentOptionItem[] {
  if (!intent) return [];
  const raw = Array.isArray(intent) ? intent : [String(intent)];
  const seen = new Set<string>();
  const result: IntentOptionItem[] = [];

  raw.forEach((v, idx) => {
    const norm = v?.trim().toLowerCase();
    if (!VALID_INTENTS.includes(norm) || seen.has(norm)) return;
    seen.add(norm);
    const source = idx === 0 ? "SEO Data" : "AI Suggested";
    result.push({
      value: norm as IntentOption,
      label: `${norm.charAt(0).toUpperCase() + norm.slice(1)} — ${source}`,
    });
  });

  return result;
}

export function SuggestionsSection({
  instruction,
  primaryKeyword,
  suggestedKeywords,
  onSelect,
  seoResult,
  selectedIntent,
  onIntentChange,
  keywordClusters = [],
}: {
  instruction: string;
  primaryKeyword: string;
  suggestedKeywords: string[];
  onSelect: (kw: string) => void;
  seoResult: SEORESULT | null;
  selectedIntent: IntentOption | "";
  onIntentChange: (intent: IntentOption) => void;
  keywordClusters?: KeywordCluster[];
}) {
  const difficultyScore = useMemo(() => {
    const value = seoResult?.keyword_difficulty;
    const numberValue = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numberValue) ? Math.round(numberValue) : 0;
  }, [seoResult?.keyword_difficulty]);

  const intentOptions = useMemo<IntentOptionItem[]>(
    () => resolveIntentOptions(seoResult?.intent),
    [seoResult?.intent],
  );

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.div
      className="w-full pb-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Primary keyword */}
      <motion.button
        type="button"
        variants={itemVariants}
        onClick={() => onSelect(primaryKeyword)}
        className="w-full mt-4 text-left relative cursor-pointer overflow-hidden rounded-xl border border-primary/20 bg-card px-5 py-4 group transition-all duration-200 hover:border-primary/50 hover:bg-accent/10"
      >
        <span className="absolute left-0 top-0 h-full w-[2px] bg-primary rounded-l-xl" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.18em] mb-0.5">
              Searched keyword
            </p>
            <h1 className="text-lg font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
              {primaryKeyword}
            </h1>
          </div>
          <div className="h-8 w-8 rounded-lg bg-primary/5 border border-primary/15 flex items-center justify-center text-primary/50 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-200">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </motion.button>

      {/* SEO metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 mt-3 gap-3">
        <motion.div
          variants={itemVariants}
          className="bg-card border border-border/50 rounded-xl p-4 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.16em]">
              Difficulty
            </span>
            <Zap className="w-3.5 h-3.5 text-primary/60" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <SafeChartRadialStacked difficultyScore={difficultyScore} />
          </div>
        </motion.div>

        <div className="flex flex-col gap-3">
          <motion.div
            variants={itemVariants}
            className="bg-card border border-border/50 rounded-xl p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.16em]">
                Search Intent
              </span>
              <Compass className="w-3.5 h-3.5 text-primary/60" />
            </div>

            <AnimatePresence mode="wait">
              {intentOptions.length > 0 && seoResult?.intent ? (
                <motion.div
                  key="intent-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full space-y-2"
                >
                  {/* Icon preview of currently selected intent */}
                  {selectedIntent && (
                    <SearchIntentCard intent={selectedIntent} />
                  )}

                  {/* Radio buttons — intents returned by backend */}
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
                          onChange={() => onIntentChange(opt.value)}
                          className="sr-only"
                        />
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
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
                </motion.div>
              ) : (
                <motion.div
                  key="intent-loader"
                  className="flex items-center gap-2 text-xs text-muted-foreground/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analyzing...
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-card border border-border/50 rounded-xl p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.16em]">
                Monthly Volume
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-sky-400/70" />
            </div>
            <AnimatePresence mode="wait">
              {seoResult?.volume ? (
                <motion.div
                  key="volume-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <MonthlyVolumeCard volume={seoResult?.volume} />
                </motion.div>
              ) : (
                <motion.div
                  key="volume-loader"
                  className="flex items-center gap-2 text-xs text-muted-foreground/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Fetching...
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Suggested alternatives */}
      <AnimatePresence>
        {instruction && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[12.5px] font-semibold text-foreground/60 mt-6 mb-3"
          >
            {instruction}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap justify-between gap-1.5">
        <AnimatePresence>
          {suggestedKeywords.length > 0 ? (
            suggestedKeywords.map((kw, idx) => (
              <motion.button
                type="button"
                key={kw}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: idx * 0.04,
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="w-[49%] group flex items-center justify-between px-4 py-3 bg-card hover:bg-accent/25 border border-border hover:border-primary/30 rounded-lg transition-all duration-200 text-left cursor-pointer"
                onClick={() => onSelect(kw)}
              >
                <span className="text-[13px] font-medium text-foreground/80 group-hover:text-primary transition-colors">
                  {kw}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </motion.button>
            ))
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 py-3 text-xs text-muted-foreground flex items-center gap-2"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Generating suggestions...
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Semantic keyword clusters */}
      <AnimatePresence>
        {keywordClusters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-3.5 h-3.5 text-primary/60" />
              <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.16em]">
                Semantic Clusters
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {keywordClusters.map((cluster) => (
                <motion.div
                  key={cluster.cluster_id}
                  variants={itemVariants}
                  className="border border-border/50 rounded-xl bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-[13px] font-semibold text-foreground/80 capitalize">
                      {cluster.label}
                    </span>
                    <span className="text-[10px] font-black text-primary/50 uppercase tracking-widest">
                      {cluster.size} kw
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cluster.keywords.map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => onSelect(kw)}
                        className="group flex items-center gap-1.5 px-2.5 py-1 bg-background hover:bg-primary/5 border border-border hover:border-primary/30 rounded-md transition-all duration-150 text-left cursor-pointer"
                      >
                        <span className="text-[12px] font-medium text-foreground/70 group-hover:text-primary transition-colors">
                          {kw}
                        </span>
                        <ArrowUpRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
