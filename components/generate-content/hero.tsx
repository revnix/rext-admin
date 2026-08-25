"use client";

import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      {/* Main heading */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        className="text-[2.4rem] md:text-[3.2rem] font-bold tracking-[-0.03em] leading-[1.06] text-foreground mt-2 mb-1"
      >
        What are we{" "}
        <span className="relative inline-block">
          <span className="text-primary dark:text-blue-600">writing</span>
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
