import { ArrowRight } from "lucide-react";
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
      <div className="mb-8">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-slate-900 tracking-tight"
        >
          {instruction}
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map((topic, index) => (
          <motion.button
            key={topic}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(topic)}
            className={cn(
              "group cursor-pointer relative flex flex-col items-start text-left p-6 rounded-xl border transition-all duration-300 w-full outline-none",
              "bg-white border-slate-200 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5 active:scale-[0.99]",
            )}
          >
            <div className="flex justify-between items-start w-full mb-4">
              <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-500 transition-colors leading-tight pr-6">
                {topic}
              </h3>
              <div className="shrink-0 p-2 rounded-lg bg-slate-50 group-hover:bg-blue-50 transition-colors">
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>

            {/* Subtle background gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl -z-10" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
