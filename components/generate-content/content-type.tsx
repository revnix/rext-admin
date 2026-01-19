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
    <div className="w-full py-8">
      <div className="mb-8">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-slate-900 tracking-tight"
        >
          {instruction}
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contentTypes.map((type: string, index: number) => {
          const Icon = getIconForType(type);
          const description = getDescriptionForType(type);

          return (
            <motion.button
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleContentTypeSelect(type)}
              className={cn(
                "group cursor-pointer relative flex flex-col items-start text-left p-8 rounded-3xl border-2 transition-all duration-300 w-full outline-none h-full",
                "bg-white border-[#F1F5F9] hover:border-[#3B82F6] hover:shadow-xl hover:shadow-blue-500/5 active:scale-[0.98]",
              )}
            >
              {/* Icon Container */}
              <div className="mb-8 p-3.5 rounded-2xl bg-[#F1F5F9] group-hover:bg-[#EFF6FF] transition-colors">
                <Icon className="w-6 h-6 text-[#475569] group-hover:text-[#3B82F6] transition-colors" />
              </div>

              {/* Content */}
              <div className="flex-1 w-full mb-2">
                <h3 className="text-2xl font-bold text-[#1E293B] group-hover:text-[#2563EB] transition-colors mb-3 capitalize">
                  {type}
                </h3>
                <p className="text-[15px] text-[#64748B] leading-[1.6] group-hover:text-[#475569] transition-colors">
                  {description}
                </p>
              </div>

              {/* Subtle hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[22px] -z-10" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
