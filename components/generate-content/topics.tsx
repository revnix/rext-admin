import { ArrowRight, RefreshCcw, Loader2, Sparkles, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopicsSectionProps {
  instruction: string;
  topics: string[];
  onSelect: (topic: string) => void;
  onRegenerate: (feedback: string) => void;
  isRegenerating?: boolean;
  keyword?: string;
}

export function TopicsSection({
  instruction,
  topics,
  onSelect,
  onRegenerate,
  isRegenerating = false,
}: TopicsSectionProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleRegenerate = () => {
    onRegenerate(feedback);
    setFeedback("");
    setShowFeedback(false);
  };

  return (
    <div className="w-full py-8">
      <div className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1 space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Step 2: Topic Selection</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-foreground tracking-tight leading-tight max-w-2xl"
          >
            {instruction}
          </motion.h2>
          <p className="text-muted-foreground text-sm">
            Select the most relevant topic for your content or request new ideas.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3 min-w-[320px]">
          <AnimatePresence mode="wait">
            {!showFeedback ? (
              <motion.div
                key="regen-button"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setShowFeedback(true)}
                  disabled={isRegenerating}
                  className="gap-2 bg-background/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                >
                  {isRegenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="w-4 h-4" />
                  )}
                  {isRegenerating ? "Regenerating..." : "Change Focus"}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="feedback-form"
                initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                className="flex flex-col gap-3 w-full bg-accent/40 p-4 rounded-2xl border border-primary/10 backdrop-blur-md shadow-xl shadow-primary/5"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                  <MessageSquare className="w-3 h-3" />
                  What should we change?
                </div>
                <Input
                  placeholder="e.g. 'Make it more technical'"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  autoFocus
                  className="h-10 bg-background/80 border-primary/10 focus-visible:ring-primary/20 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRegenerate();
                    if (e.key === "Escape") setShowFeedback(false);
                  }}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFeedback(false)}
                    className="text-xs hover:bg-background/50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleRegenerate}
                    className="text-xs px-4"
                  >
                    Regenerate
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {topics.map((topic, index) => (
          <motion.button
            key={topic}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 + 0.2, duration: 0.4 }}
            onClick={() => onSelect(topic)}
            disabled={isRegenerating}
            className={cn(
              "group cursor-pointer relative flex flex-col items-start text-left p-7 rounded-2xl border transition-all duration-300 w-full outline-none",
              "bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 active:scale-[0.98]",
              isRegenerating && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex justify-between items-start w-full gap-4">
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                {topic}
              </h3>
              <div className="shrink-0 p-2.5 rounded-xl bg-muted/50 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300 ring-1 ring-border/5 group-hover:ring-primary/20">
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Select this topic</span>
              <div className="h-px w-8 bg-primary/20" />
            </div>

            {/* Premium glass effect background */}
            <div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/2 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl -z-10" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
