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
        <p className="text-[11px] font-semibold text-primary/70 tracking-[0.12em] uppercase mb-1.5">
          Step 4
        </p>
        <h2 className="text-xl font-bold text-foreground tracking-tight leading-snug">
          {instruction}
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {contentTypes.map((type: string, index: number) => {
          const Icon = getIconForType(type);
          const description = getDescriptionForType(type);

          return (
            <motion.button
              key={type}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.05,
                duration: 0.38,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={() => handleContentTypeSelect(type)}
              className={cn(
                "group cursor-pointer relative flex flex-col items-start text-left p-5 rounded-xl border transition-all duration-200 w-full outline-none h-full",
                "bg-card border-border hover:border-primary/40 hover:bg-accent/20 active:scale-[0.98]",
              )}
            >
              <div className="mb-4 p-2.5 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              <div className="flex-1 w-full">
                <h3 className="text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors mb-1.5 capitalize leading-tight">
                  {type}
                </h3>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/4 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl -z-10" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
