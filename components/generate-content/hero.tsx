"use client";

import { motion } from "framer-motion";

const STEPS = ["Keyword", "Topics", "Type", "Outline", "Article"];

export function HeroSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="text-center mb-10 select-none"
    >
      {/* Step pipeline indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="inline-flex items-center gap-0 mb-8 border border-border/40 rounded-lg overflow-hidden bg-card"
      >
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 ${i === 0 ? "bg-primary/10" : ""}`}
            >
              <span
                className={`text-[10px] font-bold tracking-[0.1em] uppercase ${
                  i === 0 ? "text-primary" : "text-muted-foreground/40"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={`text-[10px] font-semibold ${
                  i === 0 ? "text-foreground/80" : "text-muted-foreground/30"
                }`}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="w-px h-5 bg-border/40" />}
          </div>
        ))}
      </motion.div>

      {/* Main heading */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        className="text-[2.4rem] md:text-[3.2rem] font-bold tracking-[-0.03em] leading-[1.06] text-foreground mb-4"
      >
        What are we{" "}
        <span className="relative inline-block">
          <span className="text-primary">writing</span>
        </span>{" "}
        today?
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.28, duration: 0.45 }}
        className="text-[14px] text-muted-foreground max-w-xl mx-auto leading-relaxed"
      >
        Enter a keyword — AI researches, plans, and writes fully optimized
        content in minutes.
      </motion.p>
    </motion.div>
  );
}
