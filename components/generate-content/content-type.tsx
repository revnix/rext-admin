import {
  FileText,
  BookOpen,
  Zap,
  Target,
  HelpCircle,
  MessageSquare,
  Search,
  Newspaper,
  Layout,
  BarChart3,
  FileCheck2,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ContentTypeProps {
  instruction: string;
  contentTypes: string[];
  handleContentTypeSelect: (type: string) => void;
}

const getIconForType = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("article")) return FileText;
  if (t.includes("blog")) return Newspaper;
  if (t.includes("report")) return BarChart3;
  if (t.includes("whitepaper")) return FileCheck2;
  if (t.includes("guide") || t.includes("educational")) return BookOpen;
  if (t.includes("expert") || t.includes("opinion")) return Zap;
  if (t.includes("how-to") || t.includes("tutorial")) return Layout;
  if (t.includes("case study")) return Target;
  if (t.includes("review")) return Search;
  if (t.includes("faq")) return HelpCircle;
  if (t.includes("interview")) return MessageSquare;
  return FileText;
};

const getDescriptionForType = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("blog"))
    return "Comprehensive, detailed analysis with rich insights.";
  if (t.includes("article"))
    return "Professional content tailored to your specific audience.";
  if (t.includes("report"))
    return "Data-driven results and professional formatting.";
  if (t.includes("whitepaper"))
    return "Technical, in-depth documentation for authority.";
  if (t.includes("guide"))
    return "Step-by-step educational content for your audience.";
  if (t.includes("expert"))
    return "Persuasive and highly personal professional perspective.";
  return "High-quality content optimized for engagement and conversion.";
};

export default function ContentType({
  instruction,
  contentTypes,
  handleContentTypeSelect,
}: ContentTypeProps) {
  return (
    <div className="w-full py-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mb-7"
      >
        <p className="text-[10px] font-black text-primary/60 tracking-[0.2em] uppercase mb-2">
          Step 04
        </p>
        <h2 className="text-[1.4rem] font-bold text-foreground tracking-tight leading-snug">
          {instruction}
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {contentTypes.map((type: string, index: number) => {
          const Icon = getIconForType(type);
          const description = getDescriptionForType(type);

          return (
            <motion.button
              key={type}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.05,
                duration: 0.38,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={() => handleContentTypeSelect(type)}
              className={cn(
                "group relative flex flex-col items-start text-left p-5 rounded-xl border transition-all duration-200 w-full outline-none h-full overflow-hidden",
                "bg-card border-border/50 hover:border-primary/35 hover:bg-accent/15 active:scale-[0.98] cursor-pointer",
              )}
            >
              {/* Subtle hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Index number — decorative background */}
              <span className="absolute -bottom-1 -right-1 text-[56px] font-black leading-none select-none pointer-events-none text-foreground/[0.03] group-hover:text-primary/[0.05] transition-colors duration-300">
                {String(index + 1).padStart(2, "0")}
              </span>

              {/* Icon */}
              <div className="relative z-10 mb-4 w-9 h-9 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors duration-200">
                <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
              </div>

              {/* Content */}
              <div className="relative z-10 flex-1 w-full">
                <h3 className="text-[13.5px] font-semibold text-foreground group-hover:text-primary transition-colors duration-200 mb-1.5 capitalize leading-tight">
                  {type}
                </h3>
                <p className="text-[12px] text-muted-foreground/70 leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Arrow */}
              <div className="relative z-10 mt-4 self-end">
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/25 group-hover:text-primary/60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
