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
        <p className="text-[10px] font-black text-primary/60 tracking-[0.2em] uppercase mb-2">
          Step 03
        </p>
        <h2 className="text-[1.4rem] font-bold text-foreground tracking-tight leading-snug">
          {instruction}
        </h2>
      </motion.div>

      {/* Single bordered container with dividers */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="border border-border/50 rounded-2xl overflow-hidden bg-card divide-y divide-border/30"
      >
        {topics.map((topic, index) => (
          <motion.button
            key={topic}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: 0.15 + index * 0.05,
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
            onClick={() => onSelect(topic)}
            className={cn(
              "group relative flex items-center justify-between text-left w-full px-5 py-4 outline-none",
              "hover:bg-accent/20 active:bg-accent/30 transition-colors duration-200 cursor-pointer",
            )}
          >
            {/* Left accent line */}
            <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary origin-center scale-y-0 group-hover:scale-y-100 transition-transform duration-200 rounded-full" />

            <div className="flex items-center gap-4 pr-4 min-w-0">
              <span className="shrink-0 text-[10px] font-black text-muted-foreground/20 group-hover:text-primary/40 transition-colors tracking-wider">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[14px] font-medium text-foreground/80 group-hover:text-foreground transition-colors leading-snug truncate">
                {topic}
              </span>
            </div>

            <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/30 group-hover:text-primary group-hover:bg-primary/8 transition-all duration-200">
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
            </span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
