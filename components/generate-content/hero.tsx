"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="text-center mb-12 select-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/25 bg-primary/5 mb-7"
      >
        <Sparkles className="w-3 h-3 text-primary" />
        <span className="text-[11px] font-semibold text-primary tracking-[0.11em] uppercase">
          AI Content Engine
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="text-[2.6rem] md:text-[3.4rem] font-bold tracking-[-0.03em] leading-[1.06] text-foreground mb-4"
      >
        What are we{" "}
        <span className="relative inline-block">
          <span className="text-primary">writing</span>
          <motion.span
            className="absolute -bottom-0.5 left-0 h-[2px] bg-primary/35 rounded-full w-full"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              delay: 0.52,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        </span>{" "}
        today?
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-[15px] text-muted-foreground max-w-[380px] mx-auto leading-relaxed"
      >
        Enter a keyword — our AI researches, plans, and writes fully optimized
        content.
      </motion.p>
    </motion.div>
  );
}
