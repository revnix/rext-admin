import type { SEORESULT } from "@/types/generate-content";
import { Zap, Compass, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import { SafeChartRadialStacked } from "../ui/content/safe-chart-radial-stacked";
import { MonthlyVolumeCard } from "../ui/content/monthly-volume-card";
import { SearchIntentCard } from "../ui/content/intent-card";
import { Button } from "../ui/button";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.button
        type="button"
        variants={itemVariants}
        onClick={() => onSelect(primaryKeyword)}
        className="w-full text-left relative mt-4 cursor-pointer overflow-hidden rounded-xl border border-primary/30 bg-card p-4 group transition-all duration-200 hover:border-primary/60 hover:shadow-sm"
      >
        <span className="absolute left-0 top-0 h-full w-1 bg-primary" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Searched Keyword</p>
            <h1 className="text-2xl md:text-3xl font-semibold leading-snug text-foreground">
              {primaryKeyword}
            </h1>
          </div>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-primary transition-all duration-200 group-hover:translate-x-1 group-hover:bg-primary group-hover:text-primary-foreground">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </motion.button>

      <div className="grid grid-cols-1 md:grid-cols-2 mt-4 gap-3">
        <motion.div
          variants={itemVariants}
          className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Difficulty
            </span>
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <SafeChartRadialStacked difficultyScore={difficultyScore} />
          </div>
        </motion.div>

        <div className="flex flex-col gap-3">
          <motion.div
            variants={itemVariants}
            className="bg-card border border-border rounded-xl p-4 h-full flex flex-col justify-between transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                Search Intent
              </span>
              <Compass className="w-4 h-4 text-primary" />
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
                    className="flex items-center gap-2 text-sm text-muted-foreground italic"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Analyzing intent...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-card border border-border rounded-xl p-4 h-full flex flex-col justify-between transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Monthly Volume
              </span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
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
                  className="flex items-center gap-2 text-sm text-muted-foreground italic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Fetching volume...
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {instruction && (
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-semibold my-4"
          >
            {instruction}
          </motion.h2>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {suggestedKeywords.length > 0 ? (
            suggestedKeywords.map((kw, idx) => (
              <motion.div
                key={kw}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Button
                  variant="outline"
                  onClick={() => onSelect(kw)}
                  className="bg-muted hover:bg-accent rounded-full text-sm transition-all ease-in-out duration-300"
                >
                  <strong>{kw}</strong>
                </Button>
              </motion.div>
            ))
          ) : (
            <motion.div
              key="suggestions-loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-sm text-muted-foreground italic py-2"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating suggestions...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
