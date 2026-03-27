"use client";

import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TopicsSectionProps {
  instruction: string;
  topics: string[];
  onSelect: (topic: string) => void;
  keyword?: string;
}

export function TopicsSection({
  instruction,
  topics,
  onSelect,
}: TopicsSectionProps) {
  return (
    <div className="w-full py-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mb-7"
      >
        <p className="text-[11px] font-semibold text-primary/70 tracking-[0.12em] uppercase mb-1.5">
          Step 3
        </p>
        <h2 className="text-xl font-bold text-foreground tracking-tight leading-snug">
          {instruction}
        </h2>
      </motion.div>

      <div className="flex flex-col gap-2">
        {topics.map((topic, index) => (
          <motion.button
            key={topic}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: index * 0.04,
              duration: 0.38,
              ease: [0.22, 1, 0.36, 1],
            }}
            onClick={() => onSelect(topic)}
            className={cn(
              "group cursor-pointer relative flex items-center justify-between text-left px-5 py-4 rounded-xl border w-full outline-none",
              "bg-card border-border hover:border-primary/40 hover:bg-accent/30 active:scale-[0.995] transition-all duration-200",
            )}
          >
            <span className="text-[14px] font-medium text-foreground group-hover:text-primary transition-colors leading-snug pr-4">
              {topic}
            </span>
            <span className="shrink-0 w-7 h-7 rounded-lg border border-border/60 bg-muted/50 group-hover:border-primary/30 group-hover:bg-primary/5 flex items-center justify-center transition-all duration-200">
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
