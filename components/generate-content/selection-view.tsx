"use client";

import { Sparkles, Library, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface SelectionViewProps {
  onStartFresh: () => void;
  onPickFromLibrary: () => void;
}

export function SelectionView({
  onStartFresh,
  onPickFromLibrary,
}: SelectionViewProps) {
  const options = [
    {
      num: "01",
      icon: Sparkles,
      label: "New Research",
      title: "Start Fresh",
      description:
        "Analyze a new keyword from scratch. AI maps the SERP landscape, generates topic angles, and writes a fully optimized article.",
      cta: "Begin Research",
      accent: "sky",
      onClick: onStartFresh,
    },
    {
      num: "02",
      icon: Library,
      label: "Saved Data",
      title: "From Library",
      description:
        "Pick a previously analyzed keyword and skip research entirely. Jump straight to topics with existing SERP intelligence.",
      cta: "Browse Keywords",
      accent: "violet",
      onClick: onPickFromLibrary,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[72vh] px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-14"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 border border-border/40 bg-card rounded-md">
          <span className="block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
            Content Engine Ready
          </span>
        </div>
        <h1 className="text-[2.6rem] md:text-[3rem] font-bold tracking-[-0.035em] text-foreground mb-3 leading-[1.08]">
          Where are we
          <br />
          starting today?
        </h1>
        <p className="text-[14px] text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
          Both paths end with a fully written, SEO-optimized article.
        </p>
      </motion.div>

      {/* Option cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
        {options.map((opt, i) => {
          const Icon = opt.icon;
          const isBlue = opt.accent === "sky";
          return (
            <motion.button
              key={opt.num}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.09,
                duration: 0.48,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={opt.onClick}
              className={`group relative text-left overflow-hidden border border-border/40 rounded-2xl p-7 bg-card transition-all duration-250 outline-none active:scale-[0.99] cursor-pointer ${
                isBlue
                  ? "hover:border-sky-500/30"
                  : "hover:border-violet-500/30"
              } hover:bg-accent/10`}
            >
              {/* Hover glow */}
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl ${
                  isBlue
                    ? "bg-[radial-gradient(ellipse_at_top_left,hsl(199,89%,48%,0.07),transparent_60%)]"
                    : "bg-[radial-gradient(ellipse_at_top_left,hsl(262,83%,58%,0.07),transparent_60%)]"
                }`}
              />

              {/* Step number — decorative */}
              <span
                className={`absolute -top-1 right-5 text-[96px] font-black leading-none select-none pointer-events-none ${
                  isBlue ? "text-sky-500/[0.06]" : "text-violet-500/[0.06]"
                } group-hover:opacity-100 transition-opacity duration-300`}
              >
                {opt.num}
              </span>

              {/* Icon */}
              <div
                className={`relative z-10 w-9 h-9 rounded-lg flex items-center justify-center mb-6 ${
                  isBlue ? "bg-sky-500/10" : "bg-violet-500/10"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isBlue ? "text-sky-400" : "text-violet-400"}`}
                  strokeWidth={2}
                />
              </div>

              {/* Content */}
              <div className="relative z-10">
                <p
                  className={`text-[10px] font-bold tracking-[0.16em] uppercase mb-1.5 ${
                    isBlue ? "text-sky-500/60" : "text-violet-500/60"
                  }`}
                >
                  {opt.label}
                </p>
                <h3 className="text-[18px] font-bold text-foreground mb-2.5 tracking-tight leading-tight">
                  {opt.title}
                </h3>
                <p className="text-[12.5px] text-muted-foreground leading-relaxed mb-7">
                  {opt.description}
                </p>
                <span
                  className={`inline-flex items-center gap-2 text-[12px] font-semibold transition-all duration-200 group-hover:gap-3 ${
                    isBlue
                      ? "text-sky-400/80 group-hover:text-sky-400"
                      : "text-violet-400/80 group-hover:text-violet-400"
                  }`}
                >
                  {opt.cta}
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
