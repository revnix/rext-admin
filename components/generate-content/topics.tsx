import { motion } from "framer-motion";
import {
  Lightbulb,
  Target,
  TrendingUp,
  Zap,
  BookOpen,
  ArrowRight,
} from "lucide-react";

const topicIcons = [Lightbulb, Target, TrendingUp, Zap, BookOpen];

// Matching the colors from the screenshot: Blue, Purple, Green, Orange, Pink.
// Using specific background/text classes to mimic the look.
const iconColors = [
  "bg-blue-50 text-blue-600",
  "bg-purple-50 text-purple-600",
  "bg-green-50 text-green-600",
  "bg-orange-50 text-orange-600",
  "bg-pink-50 text-pink-600",
];

export function TopicsSection({
  instruction,
  topics,
  onSelect,
}: {
  instruction: string;
  topics: string[];
  onSelect: (kw: string) => void;
}) {
  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold my-4">{instruction}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map((topic, index) => {
          const Icon = topicIcons[index % topicIcons.length];
          const iconColorClass = iconColors[index % iconColors.length];

          return (
            <motion.button
              key={topic}
              type="button"
              onClick={() => onSelect(topic)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/30"
            >
              {/* Icon Badge */}
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${iconColorClass} mb-4`}
              >
                <Icon className="h-6 w-6" />
              </div>

              {/* Decorative Background Icon */}
              <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
                <Icon className="h-24 w-24" />
              </div>

              {/* Topic Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
                {topic}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-500 mb-4">
                Explore content opportunities for this topic
              </p>

              {/* Action Link */}
              <div className="flex items-center text-blue-600 font-medium text-sm mt-auto group-hover:gap-2 transition-all duration-300">
                <span>Select topic</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
