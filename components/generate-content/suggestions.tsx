"use client";

import type { SEORESULT } from "@/types/generate-content";
import {
  Zap,
  Compass,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { SafeChartRadialStacked } from "../ui/content/safe-chart-radial-stacked";
import { MonthlyVolumeCard } from "../ui/content/monthly-volume-card";
import { SearchIntentCard } from "../ui/content/intent-card";
import { useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

export function SuggestionsSection({
  instruction,
  primaryKeyword,
  suggestedKeywords,
  onSelect,
  seoResult,
}: {
  instruction: string;
  primaryKeyword: string;
  suggestedKeywords: string[];
  onSelect: (kw: string) => void;
  seoResult: SEORESULT | null;
}) {
  const difficultyScore = useMemo(() => {
    const value = seoResult?.keyword_difficulty;
    const numberValue = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numberValue) ? Math.round(numberValue) : 0;
  }, [seoResult?.keyword_difficulty]);

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
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Step label */}
      <motion.p
        variants={itemVariants}
        className="text-[11px] font-semibold text-primary/70 tracking-[0.12em] uppercase mt-5 mb-3"
      >
        Step 2 — Select keyword
      </motion.p>

      {/* Primary keyword */}
      <motion.button
        type="button"
        variants={itemVariants}
        onClick={() => onSelect(primaryKeyword)}
        className="w-full text-left relative cursor-pointer overflow-hidden rounded-xl border border-primary/25 bg-card px-5 py-4 group transition-all duration-200 hover:border-primary/50 hover:bg-accent/15"
      >
        <span className="absolute left-0 top-0 h-full w-0.5 bg-primary rounded-l-xl" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground/50 font-semibold uppercase tracking-widest mb-0.5">
              Searched keyword
            </p>
            <h1 className="text-lg font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
              {primaryKeyword}
            </h1>
          </div>
          <div className="h-8 w-8 rounded-lg bg-primary/5 border border-primary/15 flex items-center justify-center text-primary/60 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-200">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </motion.button>

      {/* SEO metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 mt-3 gap-3">
        <motion.div
          variants={itemVariants}
          className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Difficulty
            </span>
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <SafeChartRadialStacked difficultyScore={difficultyScore} />
          </div>
        </motion.div>

        <div className="flex flex-col gap-3">
          <motion.div
            variants={itemVariants}
            className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Search Intent
              </span>
              <Compass className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex items-center gap-3">
              <AnimatePresence mode="wait">
                {seoResult?.intent ? (
                  <motion.div
                    key="intent-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <SearchIntentCard
                      intent={
                        seoResult?.intent as
                          | "informational"
                          | "commercial"
                          | "transactional"
                          | "navigational"
                      }
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="intent-loader"
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Analyzing...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Monthly Volume
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
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
                  className="flex items-center gap-2 text-xs text-muted-foreground"
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
            className="text-[13px] font-semibold text-foreground/70 mt-5 mb-3"
          >
            {instruction}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-1.5">
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
                className="w-full group flex items-center justify-between px-4 py-3 bg-card hover:bg-accent/25 border border-border hover:border-primary/30 rounded-lg transition-all duration-200 text-left cursor-pointer"
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
    </motion.div>
  );
}
